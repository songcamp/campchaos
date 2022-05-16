import { createCanvas, loadImage } from "canvas";
import fs from "fs";
import { expose } from "threads/worker"

import {
    width,
    height,
    baseImageUri,
    dnaToPathParams,
    dnaToAttributeNames,
    mp3Base,
    waveBase,
} from "../config";

type Layer = {
    name: string;
    position: {
        x: number;
        y: number;
    };
    size: {
        width: number;
        height: number;
    };
    elements: {
        id: number;
        name: string;
        path: string | null;
        pathGenerator: (params: any) => string | null;
        traitType: string;
    }[];
};

type ConstructedLayer = {
    position: {
        x: number;
        y: number;
    };
    size: {
        width: number;
        height: number;
    };
    selectedElement: any;
};

const getAttributeForElement = (
    _element: {
        layer: ConstructedLayer;
        loadedImage: any;
    },
    _dna: number[]
): {
    trait_type: string;
    value: string;
} => {
    let selectedElement = _element.layer.selectedElement;
    const attributeNames = dnaToAttributeNames(_dna);
    let attribute = {
        trait_type: selectedElement.traitType || "",
        value: attributeNames[selectedElement.traitType],
    };
    return attribute;
};

const generateMetadata = (
    _dna: number[],
    _edition: number,
    _attributesList: { trait_type: string; value: string }[],
    _songs: { [key: string]: any }
) => {
    let tempMetadata = {
        name: `Chaos #${_edition}`,
        description: _songs[_dna[0]][_dna[1]]["Description"],
        animation_url: encodeURI(
            mp3Base + _songs[_dna[0]][_dna[1]]["Main Audio"]
        ),
        losslessAudio: encodeURI(
            waveBase + _songs[_dna[0]][_dna[1]]["Lossless Audio"]
        ),
        image: `${baseImageUri}/${_edition}.png`,
        attributes: _attributesList,
        edition: _edition,
    };
    return tempMetadata;
};

const loadLayerImg = async (
    _layer: ConstructedLayer
): Promise<{ layer: ConstructedLayer; loadedImage: any }> => {
    return new Promise(async (resolve) => {
        // console.log(`Loading ${_layer.selectedElement.path}`);
        let image;
        try {
            image = await loadImage(`${_layer.selectedElement.path}`);
        } catch (error) {
            console.log(`Failed to load image ${_layer.selectedElement.path}`);
        }
        resolve({ layer: _layer, loadedImage: image });
    });
};

const loadEmptyLayer = async (
    _layer: ConstructedLayer
): Promise<{ layer: ConstructedLayer; loadedImage: any }> => {
    return new Promise(async (resolve) => {
        resolve({ layer: _layer, loadedImage: undefined });
    });
};

const constructLayer = (_folder: string, _dna: number[], _layers: Layer[]) => {
    let mappedDnaToLayers = _layers.map((layer, index) => {
        let dnaIndex = index;
        let selectedElement = layer.elements.find(
            (element) => element.id === _dna[dnaIndex]
        );
        const pathParams = dnaToPathParams(_dna);
        if (selectedElement) {
            selectedElement.path =
                _folder + selectedElement.pathGenerator(pathParams);
        }
        return {
            position: layer.position,
            size: layer.size,
            selectedElement: { ...selectedElement },
        };
    });
    return mappedDnaToLayers;
};

const applyAdditionalMetadata = (
    act: number,
    scene: number,
    attributes: { trait_type: string; value: string }[],
    songData: { [key: string]: any }
): { trait_type: string; value: string }[] => {
    const attributeList = [
        "Song Title",
        "Album",
        "Artist",
        "Genre",
        "House",
        "Collaborators",
        "Song Credits",
        "BPM",
        "Key",
        "Release Date",
        "Distributed by",
        "Manifested by",
        "Chaos Full Credits",
    ];
    attributeList.forEach((attr) =>
        attributes.push({
            trait_type: attr,
            value: songData[act][scene][attr],
        })
    );
    return attributes;
};

const saveImage = (_folder: string, _editionCount: string, image: Buffer) => {
    // fs.writeFileSync(`./output6/${_editionCount}.png`, canvas.toBuffer('image/png'))
    fs.writeFileSync(`${_folder}${_editionCount}.png`, image);
};

const saveMetadata = (_folder: string, _metadata: any) => {
    fs.writeFileSync(
        `${_folder}${_metadata.edition}.json`,
        JSON.stringify(_metadata)
    );
};

expose(async function generate(params: {
  inputfolder: string,
  output: string,
  allSongs: any,
  allDna: any,
  layers: Layer[],
  start: number,
  end: number,
  supercharged: boolean
  
}) {
        console.log("##################");
        console.log("# Generative Art");
        console.log("# - Create your NFT collection");
        console.log("##################");

        console.log();
        console.log("start creating NFTs.");

        const allDna = params.allDna

        const canvas = createCanvas(width, height);
        const ctx = canvas.getContext("2d");
        const drawElement = (_element: {
            layer: ConstructedLayer;
            loadedImage: any;
        }) => {
            if (_element.loadedImage) {
                ctx.drawImage(
                    _element.loadedImage,
                    _element.layer.position.x,
                    _element.layer.position.y,
                    _element.layer.size.width,
                    _element.layer.size.height
                );
            }
        };
        for (let i = params.start; i < params.end; i++) {
            const index = i;
            const newDna = allDna[index];

            console.log("-----------------");
            console.log("creating NFT %d of %d", index, params.end);

            console.log("- dna: " + newDna.join("-"));

            // propagate information about required layer contained within config into a mapping object
            // = prepare for drawing
            let results = constructLayer(params.inputfolder, newDna, params.layers);
            let loadedElements: Promise<{
                layer: ConstructedLayer;
                loadedImage: any;
            }>[] = [];

            // load all images to be used by canvas
            results.forEach((layer) => {
                // console.log({selected: layer.selectedElement})
                if (
                    layer.selectedElement.path !== null &&
                    layer.selectedElement.path?.toLowerCase().indexOf("none") ==
                        -1 &&
                    layer.selectedElement.path?.toLowerCase().indexOf("null") ==
                        -1
                ) {
                    loadedElements.push(loadLayerImg(layer));
                } else {
                    loadedElements.push(loadEmptyLayer(layer));
                }
            });

            // elements are loaded asynchronously
            // -> await for all to be available before drawing the image
            await Promise.all(loadedElements).then((elementArray) => {
                ctx.clearRect(0, 0, width, height);

                let attributesList: { trait_type: string; value: string }[] =
                    [];

                // draw each layer
                elementArray.forEach((element) => {
                    drawElement(element);
                    attributesList.push(
                        getAttributeForElement(element, newDna)
                    );
                });

                attributesList = applyAdditionalMetadata(
                    newDna[0],
                    newDna[1],
                    attributesList,
                    params.allSongs
                );

                // add an image signature as the edition count to the top left of the image
                // signImage(`#${editionCount}`)
                // write the image to the output directory
                saveImage(params.output, index.toString(), canvas.toBuffer("image/png"));
                let nftMetadata = generateMetadata(
                    newDna,
                    index,
                    attributesList,
                    params.allSongs
                );
                saveMetadata(params.output, nftMetadata);
                console.log("- metadata: " + JSON.stringify(nftMetadata));
                console.log("- edition " + index + " created.");
                console.log();
            });
        }
  
})
