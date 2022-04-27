import "@nomiclabs/hardhat-web3";
import { task } from "hardhat/config";
import fs from "fs";
import rwc from "random-weighted-choice";
import { rarityTables } from "./config";

const createDna = (
    _rarityTables: {
        weight: number;
        id: number;
    }[][]
) => {
    let randNum: number[] = [];
    // Get format
    // Depending on format get other items
    _rarityTables.forEach((_table) => {
        const chosenItem = rwc(_table);
        randNum.push(parseInt(chosenItem));
    });
    return randNum;
};

const writeMetaData = (output: string, _data: string) => {
    fs.writeFileSync(output, _data);
};

const isDnaUnique = (_DnaList: number[][], _dna : number[]) => {
    let foundDna = _DnaList.find((i) => i.join("") === _dna.join(""));
    return foundDna == undefined ? true : false;
};

task("generate-dna", "Generates chaos DNA")
    .addParam("output", "The folder to store the output")
    .addParam("start", "Edition ID to start from")
    .addParam("size", "Edition size")
    .setAction(async (taskArgs, { web3 }) => {
        console.log("##################");
        console.log("# Generative Art");
        console.log("# - Create your NFT collection");
        console.log("##################");

        console.log();
        console.log("start creating NFTs.");

        // clear meta data from previous run
        writeMetaData(taskArgs.output, "");

        let editionCount = taskArgs.start;
        let editionSize = taskArgs.size;
        let allDna: {[key: string]: number[]} = {};
        let dnaList = [];
        while (editionCount <= editionSize) {
            let newDna = createDna(rarityTables);
            while (!isDnaUnique(dnaList, newDna)) {
                // recalculate dna as this has been used before.
                console.log(
                    "found duplicate DNA " +
                        newDna.join("-") +
                        ", recalculate..."
                );
                newDna = createDna(rarityTables);
            }
            allDna[editionCount] = newDna;
            // console.log('- dna: ' + newDna.join('-'))
            console.log(newDna.join("-"));

            dnaList.push(newDna);
            editionCount++;
        }
        writeMetaData(taskArgs.output, JSON.stringify(allDna));
    });

export default {
    solidity: "0.8.4",
};
