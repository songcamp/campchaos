import "@nomiclabs/hardhat-web3";
import { task } from "hardhat/config";
import fs from "fs";
import rwc from "random-weighted-choice";

const backgroundTable = [
    { weight: 8000, id: 1 },
    { weight: 5000, id: 2 },
    { weight: 3000, id: 3 },
    { weight: 2500, id: 4 },
    { weight: 1500, id: 5 },
    { weight: 1000, id: 6 },
];

const formatTable = [
    { weight: 2500, id: 1 },
    { weight: 7000, id: 2 },
    { weight: 11500, id: 3 },
];

const colorTable = [
    { weight: 16000, id: 1 },
    { weight: 2000, id: 2 },
    { weight: 1100, id: 3 },
    { weight: 775, id: 4 },
    { weight: 125, id: 5 },
    { weight: 1000, id: 6 },
];

const coverartTable = [
    { weight: 9000, id: 1 },
    { weight: 6000, id: 2 },
    { weight: 4200, id: 3 },
    { weight: 1000, id: 4 },
    { weight: 800, id: 5 },
];

const ribbonTable = [
    { weight: 9000, id: 1 },
    { weight: 6000, id: 2 },
    { weight: 4200, id: 3 },
    { weight: 1000, id: 4 },
    { weight: 800, id: 5 },
];

const logoTable = [
    { weight: 5800, id: 1 },
    { weight: 5793, id: 2 },
    { weight: 4000, id: 3 },
    { weight: 2000, id: 4 },
    { weight: 1888, id: 5 },
    { weight: 1200, id: 6 },
    { weight: 222, id: 7 },
    { weight: 88, id: 8 },
    { weight: 9, id: 9 },
];

const actTable = [
    { weight: 9000, id: 1 },
    { weight: 7000, id: 2 },
    { weight: 5000, id: 3 },
];

const sceneTable = [
    { weight: 1687, id: 1 },
    { weight: 1687, id: 2 },
    { weight: 1687, id: 3 },
    { weight: 1687, id: 4 },
    { weight: 1687, id: 5 },
    { weight: 1687, id: 6 },
    { weight: 1687, id: 7 },
    { weight: 1687, id: 8 },
    { weight: 1687, id: 9 },
    { weight: 1687, id: 10 },
    { weight: 1687, id: 11 },
    { weight: 1687, id: 12 },
    { weight: 250, id: 13 },
    { weight: 250, id: 14 },
    { weight: 250, id: 15 },
    { weight: 6, id: 16 },
];

const rarityTables = [
    actTable,
    sceneTable,
    backgroundTable,
    formatTable,
    colorTable,
    coverartTable,
    logoTable,
    ribbonTable,
];

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
