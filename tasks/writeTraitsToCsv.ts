import "@nomiclabs/hardhat-ethers";
import { task } from "hardhat/config";
import * as csv from "fast-csv";

const fs = require("fs");

task("writeTraitsToCSV", "Write traits to CSV")
    .addParam("metadata", "Metadata folder")
    .addParam("output", "Song CSV")
    .addParam("start", "ID to start")
    .addParam("end", "ID to end")
    .setAction(async (taskArgs, hre) => {
        const csvStream = csv.format({ headers: true });

        const start = parseInt(taskArgs.start);
        const end = parseInt(taskArgs.end);

        csvStream.pipe(process.stdout).on("end", () => process.exit());
        
        const getTrait = (metadata: any, name: string) => {
            const trait = metadata.attributes.find(
                (element: any) => element.trait_type === name
            )
            return trait?.value
        }

        for (let index = start; index < end; index++) {
            const metadataPath = `${taskArgs.metadata}/${index}.json`;
            const metadataRaw = fs.readFileSync(metadataPath);
            const metadata = JSON.parse(metadataRaw);


            csvStream.write({
                id: index,
                name: metadata.name,
                mp3: metadata.animation_url,
                wav: metadata.losslessAudio,
                image: metadata.image,
                act: getTrait(metadata, "Act"),
                scene: getTrait(metadata, "Scene"),
                paper: getTrait(metadata, "Paper"),
                background: getTrait(metadata, "Background"),
                layout: getTrait(metadata, "Layout"),
                layoutColor: getTrait(metadata, "Layout Color"),
                coverArtColor: getTrait(metadata, "Cover Art Color"),
                logo: getTrait(metadata, "Logo"),
                ribbon: getTrait(metadata, "Ribbon"),
                logocolor: getTrait(metadata, "Logo Color"),
                ribboncolor: getTrait(metadata, "Ribbon Color"),
                supercharged: getTrait(metadata, "Supercharged"),
                song: getTrait(metadata, "Song"),
                house: getTrait(metadata, "House"),
                bpm: getTrait(metadata, "BPM"),
                key: getTrait(metadata, "Key"),
            });
        }

        csvStream.end();
    });

export default {
    solidity: "0.8.4",
};
