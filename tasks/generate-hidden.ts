import "@nomiclabs/hardhat-web3";
import { task } from "hardhat/config";
import fs from "fs";

import {
    baseImageUri,
    mp3Base,
    waveBase,
    hiddenFolder,
    hiddenImages,
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


const generateMetadata = (
    _act: number,
    _scene: number,
    _edition: number,
    _attributesList: { trait_type: string; value: string }[],
    _songs: { [key: string]: any }
) => {
    let tempMetadata = {
        name: `Chaos #${_edition} - ${_songs[_act][_scene]["Song"]}`,
        description: _songs[_act][_scene]["Description"],
        animation_url: encodeURI(mp3Base + _songs[_act][_scene]["Main Audio"]),
        losslessAudio: encodeURI(
            waveBase + _songs[_act][_scene]["Lossless Audio"]
        ),
        image: `${baseImageUri}/${_edition}.png`,
        attributes: _attributesList,
        edition: _edition,
        album: _songs[_act][_scene]["Album"],
        artist: _songs[_act][_scene]["Artist"],
        genre: _songs[_act][_scene]["Genre"],
        collaborators: _songs[_act][_scene]["Collaborators"],
        songCredits: _songs[_act][_scene]["Song Credits"],
        releaseDate: _songs[_act][_scene]["Release Date"],
        distributedBy: _songs[_act][_scene]["Distributed By"],
        manifestedBy: _songs[_act][_scene]["Manifested By"],
        chaosFullCredits: _songs[_act][_scene]["Chaos Full Credits"],
    };
    return tempMetadata;
};


const applyAdditionalMetadata = (
    act: number,
    scene: number,
    attributes: { trait_type: string; value: string }[],
    songData: { [key: string]: any }
): { trait_type: string; value: string }[] => {
    const attributeList = [
        "Song", // keep
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

const saveMetadata = (_folder: string, _metadata: any) => {
    fs.writeFileSync(
        `${_folder}${_metadata.edition}.json`,
        JSON.stringify(_metadata)
    );
};

task("generate-hidden", "Generates hidden chaos song metadata")
    .addParam("output", "The folder to store the output")
    .addParam("songs", "Song json")
    .addParam("inputfolder", "Folder with all content")
    .addParam('ids', 'IDs to place hidden')
    .addOptionalParam("metadataonly", "Skip images")
    .setAction(async (taskArgs, { web3 }) => {
        console.log("##################");
        console.log("# Generative Art");
        console.log("# - Create your NFT collection");
        console.log("##################");

        console.log();
        console.log("start creating NFTs.");

        const metadataOnly = taskArgs.metadataonly === "true";

        const allSongsRaw = fs.readFileSync(taskArgs.songs, "utf8");
        const allSongs = JSON.parse(allSongsRaw);

        let metadataList: Metadata[] = [];
        const ids = taskArgs.ids.split(',')

        for (let i = 0; i < ids.length; i++) {
            const index = i;

            // const id = Math.floor(Math.random() * 19999) + 1000;
            const id = ids[i]

            console.log("-----------------");
            console.log("creating hidden NFT at %d", id);

            let attributesList: { trait_type: string; value: string }[] = [];

            attributesList = applyAdditionalMetadata(
                3,
                index,
                attributesList,
                allSongs
            );

            // add an image signature as the edition count to the top left of the image
            // signImage(`#${editionCount}`)
            // write the image to the output directory
            if (!metadataOnly)
                fs.copyFileSync(
                    `${taskArgs.inputfolder}${hiddenFolder}${hiddenImages[index]}`,
                    `${taskArgs.output}${id}.png`
                );
            // saveImage(taskArgs.output, index, canvas.toBuffer("image/png"));
            let nftMetadata = generateMetadata(
                3,
                index,
                id,
                attributesList,
                allSongs
            );
            saveMetadata(taskArgs.output, nftMetadata);
            metadataList.push(nftMetadata);
            // console.log("- metadata: " + JSON.stringify(nftMetadata));
            // console.log("- edition " + index + " created.");
            // console.log();
        }
    });

export default {
    solidity: "0.8.4",
};
