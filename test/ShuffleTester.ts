import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { deployments, ethers } from "hardhat";

import { addresses } from "./addresses";

import { ShuffleTester, ShuffleTester__factory } from "../typechain";

function countOccurences(arrIn: number[]) {
    const out: { [key: number]: number } = [];
    arrIn.forEach((v) => {
        if (out[v]) out[v]++;
        else out[v] = 1;
    });
    return out;
}

describe("Shuffle Tester", function () {
    let accounts: SignerWithAddress[];
    let shuffleTester: ShuffleTester;

    beforeEach(async function () {
        accounts = await ethers.getSigners();

        const shuffleFactory = (await ethers.getContractFactory(
            "ShuffleTester",
            accounts[0]
        )) as ShuffleTester__factory;

        shuffleTester = await shuffleFactory.deploy(20, 4, 0);
    });

    describe("Basic operation of getShuffledTokenID", function () {
        it("Should calculate shuffled token ID", async function () {
            await shuffleTester.setOffsetManual(0, 10);
            expect(await shuffleTester.getShuffledTokenId(0)).to.equal(40);
            expect(await shuffleTester.getShuffledTokenId(1)).to.equal(41);
            expect(await shuffleTester.getShuffledTokenId(2)).to.equal(42);
            expect(await shuffleTester.getShuffledTokenId(3)).to.equal(43);
        });

        it("Should calculate shuffled token ID", async function () {
            await shuffleTester.setOffsetManual(16, 10);
            expect(await shuffleTester.getShuffledTokenId(16)).to.equal(40);
            expect(await shuffleTester.getShuffledTokenId(17)).to.equal(41);
            expect(await shuffleTester.getShuffledTokenId(18)).to.equal(42);
            expect(await shuffleTester.getShuffledTokenId(19)).to.equal(43);
        });

        it("Should calculate shuffled token ID at the end", async function () {
            await shuffleTester.setOffsetManual(0, 19);
            expect(await shuffleTester.getShuffledTokenId(0)).to.equal(76);
            expect(await shuffleTester.getShuffledTokenId(1)).to.equal(77);
            expect(await shuffleTester.getShuffledTokenId(2)).to.equal(78);
            expect(await shuffleTester.getShuffledTokenId(3)).to.equal(79);
        });
    });

    describe("Basic operation of _getNextOffset", function () {
        it("Allows offsets to be set up to num available", async function () {
            for (let index = 0; index < 20; index++) {
                await shuffleTester.setRandomOffset(index);
            }
            await expect(shuffleTester.setRandomOffset(21)).to.be.revertedWith(
                "Sold out"
            );
        });
        
        it("Depletes available count to 0", async function() {
            for (let index = 0; index < 20; index++) {
                await shuffleTester.setRandomOffset(index);
            }
            expect(await shuffleTester.availableCount).to.equal(0)
            
        })

        it("Does not repeat offsets", async function () {
            const counter: { [key: number]: number } = {};
            for (let index = 0; index < 20; index++) {
                await shuffleTester.setRandomOffset(index);
                const offset = (await shuffleTester.offsets(index)).toNumber();
                if (counter[offset]) {
                    expect(false, "Duplicate detected");
                    counter[offset]++;
                } else {
                    counter[offset] = 1;
                }
            }
        });
    });

    describe("Edge cases of _getNextOffset", function () {
        it("Allows offsets to be set when swap index is 0 every time", async function () {
            for (let index = 0; index < 20; index++) {
                await shuffleTester.setOffsetSeed(index, 0);
            }
            expect(await shuffleTester.offsets(0)).to.equal(0);
            for (let index = 1; index < 20; index++) {
                expect(await shuffleTester.offsets(index)).to.equal(20 - index);
            }
        });
        it("Allows offsets to be set when swap index is max every time", async function () {
            for (let index = 0; index < 20; index++) {
                await shuffleTester.setOffsetSeed(index, (20 - index) * 2 - 1);
            }
            for (let index = 0; index < 20; index++) {
                expect(await shuffleTester.offsets(index)).to.equal(
                    20 - index - 1
                );
            }
        });
    });
});
