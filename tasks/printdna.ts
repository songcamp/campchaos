import "@nomiclabs/hardhat-ethers";
import { task } from "hardhat/config";

const fs = require("fs");

task("printdna", "Prints DNA file")
    .addParam("dna", "DNA json")
    .setAction(async (taskArgs, hre) => {
        const alldnaRaw = fs.readFileSync(taskArgs.dna);
        const alldna = JSON.parse(alldnaRaw);

        const keys = Object.keys(alldna);

        for (let index = 0; index < keys.length; index++) {
            console.log(`${index}: ${alldna[index]}`);
        }
    });

export default {
    solidity: "0.8.4",
};
