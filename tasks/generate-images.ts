import "@nomiclabs/hardhat-web3";
import { createCanvas, loadImage } from "canvas";
import { task } from "hardhat/config";
import fs from "fs";

import {
    width,
    height,
    description,
    baseImageUri,
    nullPath,
    backgroundNames,
    bgPath,
    coverNames,
    coverPath,
    dnaToPathParams,
    formatColorNames,
    formatNames,
    formatPath,
    logoNames,
    logoPath,
    ribbonNames,
    ribbonsPath,
    paperPath,
    paperNames,
    actNames,
    sceneNames,
    logoColorNames,
    ribbonColorNames,
    dnaToAttributeNames,
    mp3Base,
    waveBase,
    superchargedBgPath,
    superchargedBackgroundNames,
    superchargedFormatPath,
    superchargedCoverPath,
    superchargedLogoPath,
} from "./config";

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

type Metadata = {
    name: string;
    description: string;
    image: string;
    attributes: {
        trait_type: string;
        value: string;
    }[];
};

const addLayer = (
    _name: string,
    _path: (params: any) => string | null,
    _names: string[],
    _traitType: string,
    _position: { x: number; y: number },
    _size: { width: number; height: number }
) => {
    let elements = [];
    for (let index = 0; index < _names.length; index++) {
        const _element = {
            id: index,
            name: _names[index],
            path: null,
            pathGenerator: _path,
            traitType: _traitType,
        };
        elements.push(_element);
    }

    let elementsForLayer = {
        name: _name,
        position: _position,
        size: _size,
        elements,
    };
    return elementsForLayer;
};

const getAttributeForElement = (
    _element: {
        layer: ConstructedLayer;
        loadedImage: any;
    },
    _dna: number[],
    _supercharged: boolean
): {
    trait_type: string;
    value: string;
} => {
    let selectedElement = _element.layer.selectedElement;
    const attributeNames = dnaToAttributeNames(_dna, _supercharged);
    if (!selectedElement.traitType) {
        console.log({ selectedElement, attributeNames });
    }
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
        name: `Chaos #${_edition} - ${_songs[_dna[0]][_dna[1]]["Song"]}`,
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
        album: _songs[_dna[0]][_dna[1]]["Album"],
        artist: _songs[_dna[0]][_dna[1]]["Artist"],
        genre: _songs[_dna[0]][_dna[1]]["Genre"],
        collaborators: _songs[_dna[0]][_dna[1]]["Collaborators"],
        songCredits: _songs[_dna[0]][_dna[1]]["Song Credits"],
        releaseDate: _songs[_dna[0]][_dna[1]]["Release Date"],
        distributedBy: _songs[_dna[0]][_dna[1]]["Distributed By"],
        manifestedBy: _songs[_dna[0]][_dna[1]]["Manifested By"],
        chaosFullCredits: _songs[_dna[0]][_dna[1]]["Chaos Full Credits"],
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
        if (!selectedElement)
            console.log({ layer, dnaIndex, dna: _dna[dnaIndex] });
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
        "Song", // keep
        "House", // keep
        "BPM", // keep
        "Key", // keep
    ];
    attributeList.forEach((attr) =>
        attributes.push({
            trait_type: attr,
            value: songData[act][scene][attr],
        })
    );
    return attributes;
};

const writeMetaData = (output: string, _data: string) => {
    fs.writeFileSync(output, _data);
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

task("generate-images", "Generates chaos images")
    .addParam("output", "The folder to store the output")
    .addParam("dna", "DNA to use")
    .addParam("songs", "Song json")
    .addParam("inputfolder", "Folder with all content")
    .addParam("start", "Edition ID to start from")
    .addParam("end", "Edition ID to end on")
    .addParam("size", "Edition size")
    .addParam("supercharged", "Is supercharged or not")
    .addOptionalParam("metadataonly", "Skip images")
    .setAction(async (taskArgs, { web3 }) => {
        console.log("##################");
        console.log("# Generative Art");
        console.log("# - Create your NFT collection");
        console.log("##################");

        console.log();
        console.log("start creating NFTs.");

        const isSupercharged = taskArgs.supercharged === "true";
        const metadataOnly = taskArgs.metadataonly === "true";

        const allSongsRaw = fs.readFileSync(taskArgs.songs, "utf8");
        const allSongs = JSON.parse(allSongsRaw);

        const position = { x: 0, y: 0 };
        const size = { width, height };

        const layers = [
            addLayer("Act", nullPath, actNames, "Act", position, size),
            addLayer("Scene", nullPath, sceneNames, "Scene", position, size),
            addLayer("Paper", paperPath, paperNames, "Paper", position, size),
            addLayer(
                "Backgrounds",
                isSupercharged ? superchargedBgPath : bgPath,
                isSupercharged ? superchargedBackgroundNames : backgroundNames,
                "Background",
                position,
                size
            ),
            addLayer("Layout", nullPath, formatNames, "Layout", position, size),
            addLayer(
                "LayoutColor",
                isSupercharged ? superchargedFormatPath : formatPath,
                formatColorNames,
                "Layout Color",
                position,
                size
            ),
            addLayer(
                "CoverArt",
                isSupercharged ? superchargedCoverPath : coverPath,
                coverNames,
                "Cover Art Color",
                position,
                size
            ),
            addLayer(
                "Logo",
                isSupercharged ? superchargedLogoPath : logoPath,
                logoNames,
                "Logo",
                position,
                size
            ),
            addLayer(
                "Ribbons",
                ribbonsPath,
                ribbonNames,
                "Ribbon",
                position,
                size
            ),
            addLayer(
                "Logo Color",
                nullPath,
                logoColorNames,
                "Logo Color",
                position,
                size
            ),
            addLayer(
                "Ribbon Color",
                nullPath,
                ribbonColorNames,
                "Ribbon Color",
                position,
                size
            ),
        ];

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

        let rawdata = fs.readFileSync(taskArgs.dna, "utf8");
        const allDna = JSON.parse(rawdata);
        let metadataList: Metadata[] = [];

        for (let i = taskArgs.start; i < taskArgs.end; i++) {
            const index = i;
            const newDna = allDna[index];

            console.log("-----------------");
            console.log("creating NFT %d of %d", index, taskArgs.size);

            console.log("- dna: " + newDna.join("-"));

            // propagate information about required layer contained within config into a mapping object
            // = prepare for drawing
            let results = constructLayer(taskArgs.inputfolder, newDna, layers);
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
                        -1 &&
                    !metadataOnly
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
                    if (!metadataOnly) drawElement(element);
                    attributesList.push(
                        getAttributeForElement(element, newDna, isSupercharged)
                    );
                });

                attributesList.push({
                    trait_type: "Supercharged",
                    value: isSupercharged ? "Yes" : "No",
                });

                attributesList = applyAdditionalMetadata(
                    newDna[0],
                    newDna[1],
                    attributesList,
                    allSongs
                );

                // add an image signature as the edition count to the top left of the image
                // signImage(`#${editionCount}`)
                // write the image to the output directory
                if (!metadataOnly)
                    saveImage(
                        taskArgs.output,
                        index,
                        canvas.toBuffer("image/png")
                    );
                let nftMetadata = generateMetadata(
                    newDna,
                    index,
                    attributesList,
                    allSongs
                );
                saveMetadata(taskArgs.output, nftMetadata);
                metadataList.push(nftMetadata);
                // console.log("- metadata: " + JSON.stringify(nftMetadata));
                // console.log("- edition " + index + " created.");
                // console.log();
            });
        }
        writeMetaData(
            taskArgs.output + "output.json",
            JSON.stringify(metadataList)
        );
    });

export default {
    solidity: "0.8.4",
};
