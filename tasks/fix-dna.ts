import "@nomiclabs/hardhat-web3";
import { task } from "hardhat/config";
import fs from "fs";
import rwc from "random-weighted-choice";
import { applyOverrides, rarityTables, superchargedRarityTables } from "./config";

const createDna = (
    _rarityTables: {
        weight: number;
        id: number;
    }[][],
    _supercharged: boolean
) => {
    let randNum: number[] = [];
    // Get format
    // Depending on format get other items
    _rarityTables.forEach((_table) => {
        const chosenItem = rwc(_table);
        randNum.push(parseInt(chosenItem));
    });
    randNum = applyOverrides(randNum, _supercharged);
    return randNum;
};

const writeMetaData = (output: string, _data: string) => {
    fs.writeFileSync(output, _data);
};

const isDnaUnique = (_DnaList: number[][], _dna: number[]) => {
    let foundDna = _DnaList.find((i) => i.join("") === _dna.join(""));
    return foundDna == undefined ? true : false;
};

const isSongListUnique = (
    _DnaList: number[][],
    _dna: number[],
    _index: number,
    _start: number
) => {
    const startIndex = _index - (_index % 4) - _start;
    const endIndex = _index - _start
    for (let i = startIndex; i < endIndex; i++) {
        if (_DnaList[i][0] == _dna[0] && _DnaList[i][1] == _dna[1]) {
            console.log(
                `found duplicate song ${_dna.join("-")} ${_DnaList[i].join(
                    "-"
                )}`
            );
            return false;
        }
    }
    return true;
};

task("fix-dna", "Generates chaos DNA")
    .addParam("dna", "DNA to use")
    .addParam("output", "The folder to store the output")
    .addParam("start", "Edition ID to start from")
    .addParam("size", "Edition size")
    .addParam("supercharged", "is supercharged or not")
    .setAction(async (taskArgs, { web3 }) => {
        console.log("##################");
        console.log("# Generative Art");
        console.log("# - Create your NFT collection");
        console.log("##################");

        console.log();
        console.log("start creating NFTs.");
        
        const isSupercharged = taskArgs.supercharged === "true"
        
        console.log({isSupercharged})
        
        // clear meta data from previous run
        writeMetaData(taskArgs.output, "");
        
        if ((taskArgs.start % 4) !== 0) throw new Error('Invalid start')

        let rawdata = fs.readFileSync(taskArgs.dna, "utf8");
        

        let editionCount = taskArgs.start;
        let editionSize = taskArgs.size;
        const rarity = isSupercharged ? superchargedRarityTables : rarityTables
        let allDna: { [key: string]: number[] } = JSON.parse(rawdata)
        let dnaList = [];
        while (editionCount < editionSize) {
            let newDna = applyOverrides(allDna[editionCount], isSupercharged);
            while (
                !isDnaUnique(dnaList, newDna) ||
                !isSongListUnique(dnaList, newDna, editionCount, taskArgs.start)
            ) {
                // recalculate dna as this has been used before.
                console.log(
                    "found duplicate DNA " +
                        newDna.join("-") +
                        ", recalculate..."
                );
                newDna = createDna(rarity, isSupercharged);
            }
            allDna[editionCount] = newDna;
            // console.log('- dna: ' + newDna.join('-'))
            console.log(editionCount, newDna.join("-"));

            dnaList.push(newDna);
            editionCount++;
        }
        writeMetaData(taskArgs.output, JSON.stringify(allDna));
    });

export default {
    solidity: "0.8.4",
};
