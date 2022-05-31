import "@nomiclabs/hardhat-ethers";
import { task } from "hardhat/config";

const fs = require("fs");

const writeMetaData = (output: string, _data: string) => {
    fs.writeFileSync(output, JSON.stringify(_data));
};

task("swapBaseUri", "Prints DNA file")
    .addParam("input", "location of metadata")
    .addParam("output", "location of updated metadata")
    .addParam("start", "Index to start")
    .addParam("end", "Index to end")
    .addParam("baseuri", "New uri")
    .addOptionalParam("indexoverride", "index for all images")
    .setAction(async (taskArgs, hre) => {
        for (let index = taskArgs.start; index < taskArgs.end; index++) {
            const raw = fs.readFileSync(
                `${taskArgs.input}/${index.toString()}.json`
            );
            const metadata = JSON.parse(raw);
            metadata.image = taskArgs.indexoverride
                ? `${taskArgs.baseuri}/${taskArgs.indexoverride}.png`
                : `${taskArgs.baseuri}/${index.toString()}.png`;
            writeMetaData(
                `${taskArgs.output}/${index.toString()}.json`,
                metadata
            );
        }
    });

export default {
    solidity: "0.8.4",
};
