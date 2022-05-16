import "@nomiclabs/hardhat-web3";
import { createCanvas, loadImage } from "canvas";
import { task } from "hardhat/config";
import fs from "fs";
import { spawn, Thread, Worker } from "threads";

import {
    width,
    height,
    nullPath,
    backgroundNames,
    bgPath,
    coverNames,
    coverPath,
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

task("generate-images-parallel", "Generates chaos images")
    .addParam("output", "The folder to store the output")
    .addParam("dna", "DNA to use")
    .addParam("songs", "Song json")
    .addParam("inputfolder", "Folder with all content")
    .addParam("start", "Edition ID to start from")
    .addParam("end", "Edition ID to end on")
    .addParam("size", "Edition size")
    .addParam("supercharged", "Is supercharged or not")
    .setAction(async (taskArgs, { web3 }) => {
        console.log("##################");
        console.log("# Generative Art");
        console.log("# - Create your NFT collection");
        console.log("##################");

        console.log();
        console.log("start creating NFTs.");

        const allSongsRaw = fs.readFileSync(taskArgs.songs, "utf8");
        const allSongs = JSON.parse(allSongsRaw);

        let rawdata = fs.readFileSync(taskArgs.dna, "utf8");
        const allDna = JSON.parse(rawdata);

        type Generator = (params: {
            inputfolder: string;
            output: string;
            allSongs: any;
            allDna: any;
            layers: Layer[];
            start: number;
            end: number;
            supercharged: boolean;
        }) => Promise<void>;

        const generateImages = await spawn<Generator>(
            new Worker("./workers/generate-images-worker")
        );

        const position = { x: 0, y: 0 };
        const size = { width, height };

        const layers = [
            addLayer("Act", nullPath, actNames, "Act", position, size),
            addLayer("Scene", nullPath, sceneNames, "Scene", position, size),
            addLayer("Paper", paperPath, paperNames, "Paper", position, size),
            addLayer(
                "Backgrounds",
                taskArgs.supercharged ? superchargedBgPath : bgPath,
                taskArgs.supercharged
                    ? superchargedBackgroundNames
                    : backgroundNames,
                "Background",
                position,
                size
            ),
            addLayer("Format", nullPath, formatNames, "Format", position, size),
            addLayer(
                "FormatColor",
                taskArgs.supercharged ? superchargedFormatPath : formatPath,
                formatColorNames,
                "Format Color",
                position,
                size
            ),
            addLayer(
                "CoverArt",
                taskArgs.supercharged ? superchargedCoverPath : coverPath,
                coverNames,
                "Cover Art Color",
                position,
                size
            ),
            addLayer(
                "Logo",
                taskArgs.supercharged ? superchargedLogoPath : logoPath,
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
        ];


        await generateImages({
          inputfolder: taskArgs.inputfolder,
          output: taskArgs.output,
          allSongs,
          allDna,
          layers,
          start: taskArgs.start,
          end: taskArgs.end,
          supercharged: taskArgs.supercharged
          
        });

        await Thread.terminate(generateImages)

    });

export default {
    solidity: "0.8.4",
};
