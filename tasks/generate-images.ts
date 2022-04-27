import "@nomiclabs/hardhat-web3";
import { createCanvas, loadImage } from "canvas";
import { task } from "hardhat/config";
import fs from "fs";

// image width in pixels
const width = 1000;
// image height in pixels
const height = 1000;
// description for NFT in metadata file
const description = "Chaos";
// base url to use in metadata file
// the id of the nft will be added to this url, in the example e.g. https://hashlips/nft/1 for NFT with id 1
const baseImageUri = "Placeholder";

type pathParams = {
    act: string;
    scene: string;
    bg: string;
    format: string;
    formatColor: string;
    coverColor: string;
    logo: string;
    ribbon: string;
};
const actPathNames = ["acti", "actii", "actiii"];

const scenePathNames = [
    "1",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    "10",
    "11",
    "12",
    "13", //TODO alchemy
    "14", //TODO alchemy
    "15", //TODO alchemy
    "16", //TODO hidden
];

const bgPathNames = [
    "1",
    "2",
    "3",
    "4",
    "5",
    "6", // TODO SC
];

const formatPathNames = [
    "vinyl",
    "8track",
    "cassette", // TODO CD?
];

const formatColorPathNames = ["1", "2", "3", "4", "5"];

const coverColorPathNames = ["1", "2", "3", "4", "5"];

const ribbonPathNames = ["1", "2", "3", "4", "5"];

const logoPathNames = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];

function dnaToPathParams(dna: number[]): pathParams {
    const params = {
        act: actPathNames[dna[0] - 1],
        scene: scenePathNames[dna[1] - 1],
        bg: bgPathNames[dna[2] - 1],
        format: formatPathNames[dna[3] - 1],
        formatColor: formatColorPathNames[dna[4] - 1],
        coverColor: coverColorPathNames[dna[5] - 1],
        logo: logoPathNames[dna[6] - 1],
        ribbon: ribbonPathNames[dna[7] - 1],
    };
    // console.log({params, actPathNames, dna})
    return params;
}

const coverPath = (params: pathParams) =>
    `coverArt/${params.act}_${params.format}_scene_${params.scene}_dist1_color${params.coverColor}.png`;
const formatPath = (params: pathParams) =>
    `format/${params.act}_${params.format}_master_scene_${params.scene}_color${params.formatColor}.png`;
const logoPath = (params: pathParams) =>
    `logos/${params.act}_${params.format}_master_logo_${params.logo}_color${params.formatColor}.png`;
const ribbonsPath = (params: pathParams) =>
    `ribbons/${params.act}_${params.format}_master_ribbon${params.ribbon}_color${params.formatColor}.png`;
const bgPath = (params: pathParams) => `backgrounds/paper${params.bg}`;
const nullPath = (params: pathParams) => null;

const formatNames = ["Vinyl", "8track", "Casette"];
const coverNames = [
    "Cover Art Color 1",
    "Cover Art Color 2",
    "Cover Art Color 3",
    "Cover Art Color 4",
    "Cover Art Color 5",
];
const formatColorNames = [
    "Color 1",
    "Color 2",
    "Color 3",
    "Color 4",
    "Color 5",
    "Supercharged", // todo not how sc works
];
const logoNames = [
    "Logo 1",
    "Logo 2",
    "Logo 3",
    "Logo 4",
    "Logo 5",
    "Logo 6",
    "Logo 7",
    "Logo 8",
    "Logo 9",
];
const ribbonNames = [
    "Ribbon 1",
    "Ribbon 2",
    "Ribbon 3",
    "Ribbon 4",
    "Ribbon 5",
];
const backgroundNames = [
    "Off White",
    "Egg Shell",
    "Water Stained",
    "Creased",
    "Chaos",
    "Supercharged",
];

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

const getAttributeForElement = (_element: {
    layer: ConstructedLayer;
    loadedImage: any;
}): {
    trait_type: string;
    value: string;
} => {
    let selectedElement = _element.layer.selectedElement;
    let attribute = {
        trait_type: selectedElement.traitType || "",
        value: selectedElement.name || "",
    };
    return attribute;
};

type Metadata = {
    name: string;
    description: string;
    image: string;
    attributes: {
        trait_type: string;
        value: string;
    }[];
    edition: number;
};

const generateMetadata = (
    _dna: number[],
    _edition: number,
    _attributesList: { trait_type: string; value: string }[]
) => {
    let tempMetadata = {
        name: `Song #${_edition}`,
        description: description,
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
        console.log(`Loading ${_layer.selectedElement.path}`);
        // const image = await loadImage(`${_layer.selectedElement.path}`);
        const image = "";
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
    .addParam("inputfolder", "Folder with all content")
    .addParam("start", "Edition ID to start from")
    .addParam("end", "Edition ID to end on")
    .addParam("size", "Edition size")
    .setAction(async (taskArgs, { web3 }) => {
        console.log("##################");
        console.log("# Generative Art");
        console.log("# - Create your NFT collection");
        console.log("##################");

        console.log();
        console.log("start creating NFTs.");

        const position = { x: 0, y: 0 };
        const size = { width, height };

        const layers = [
            addLayer(
                "Backgrounds",
                bgPath,
                backgroundNames,
                "Background",
                position,
                size
            ),
            addLayer("Format", nullPath, formatNames, "Format", position, size),
            addLayer(
                "FormatColor",
                formatPath,
                formatColorNames,
                "Format Color",
                position,
                size
            ),
            addLayer(
                "CoverArt",
                coverPath,
                coverNames,
                "Cover Art",
                position,
                size
            ),
            addLayer("Logo", logoPath, logoNames, "Logo", position, size),
            addLayer(
                "Ribbons",
                ribbonsPath,
                ribbonNames,
                "Ribbons",
                position,
                size
            ),
        ];

        const constructLayer = (_dna: number[], _layers: Layer[]) => {
            let mappedDnaToLayers = _layers.map((layer, index) => {
                let dnaIndex = index;
                let selectedElement = layer.elements.find(
                    (element) => element.id === _dna[dnaIndex]
                );
                const pathParams = dnaToPathParams(_dna);
                if (selectedElement) {
                    selectedElement.path =
                        taskArgs.inputfolder +
                        selectedElement.pathGenerator(pathParams);
                }
                return {
                    position: layer.position,
                    size: layer.size,
                    selectedElement: { ...selectedElement },
                };
            });
            return mappedDnaToLayers;
        };

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

        for (let i = taskArgs.start; i <= taskArgs.end; i++) {
            // index = fixList[i]
            const index = i;
            const newDna = allDna[index];

            console.log("-----------------");
            console.log("creating NFT %d of %d", index, taskArgs.size);

            console.log("- dna: " + newDna.join("-"));

            // propagate information about required layer contained within config into a mapping object
            // = prepare for drawing
            let results = constructLayer(newDna, layers);
            let loadedElements: Promise<{
                layer: ConstructedLayer;
                loadedImage: any;
            }>[] = [];

            // load all images to be used by canvas
            results.forEach((layer) => {
                // console.log({selected: layer.selectedElement})
                if (layer.selectedElement.path !== null) {
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
                    // drawElement(element);
                    attributesList.push(getAttributeForElement(element));
                });
                // add an image signature as the edition count to the top left of the image
                // signImage(`#${editionCount}`)
                // write the image to the output directory
                // saveImage(taskArgs.output, index, canvas.toBuffer("image/png"));
                let nftMetadata = generateMetadata(
                    newDna,
                    index,
                    attributesList
                );
                saveMetadata(taskArgs.output, nftMetadata);
                metadataList.push(nftMetadata);
                console.log("- metadata: " + JSON.stringify(nftMetadata));
                console.log("- edition " + index + " created.");
                console.log();
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
