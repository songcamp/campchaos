import "@nomiclabs/hardhat-ethers";
import { task } from "hardhat/config";
import * as csv from "@fast-csv/parse";

const fs = require("fs");

const saveMetadata = (_filePath: string, _json: any) => {
    fs.writeFileSync(_filePath, JSON.stringify(_json));
};

task("parsecsv", "Parse song CSV")
    .addParam("csv", "Song CSV")
    .addParam("output", "Song JSON")
    .setAction(async (taskArgs, hre) => {
        const dataMap: { [key: string]: any } = {};
        const myPromise = new Promise((resolve, reject) => {
            fs.createReadStream(taskArgs.csv)
                .pipe(csv.parse({ headers: true }))
                .on("error", (error: any) => console.error(error))
                .on("data", (row: { [key: string]: string }) => {
                    // console.log({row, act: row.ActID, scene: row.SceneId})
                    if (dataMap[row["ActID"]]) {
                        console.log(`Setting existing ${row}`);
                        dataMap[row["ActID"]][row["SceneId"]] = row;
                    } else {
                        console.log(`Setting new ${row}`);
                        dataMap[row["ActID"]] = {
                            [row["SceneId"]]: row,
                        };
                    }
                })
                .on("end", (rowCount: any) => {
                    console.log(`Parsed ${rowCount} rows`);
                    resolve("done");
                });
        });

        const a = await myPromise;
        console.log({ dataMap });
        console.log({ a });
        saveMetadata(taskArgs.output, dataMap);
    });

export default {
    solidity: "0.8.4",
};
