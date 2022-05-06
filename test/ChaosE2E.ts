import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { deployments, ethers } from "hardhat";

import { addresses } from "./addresses";

import {
    ChaosSongs,
    ChaosSongs__factory,
    SplitMain,
    SplitMain__factory,
    ChaosPacks,
    ChaosPacks__factory,
} from "../typechain";

const config = {
    baseUri: "https://placeholder.com/{}.json",
    contractUri: "https://placeholder.com/contract.json",
    supercharged: 1000,
    distributorFee: 0,
    recipient: "0xd1ed25240ecfa47fD2d46D34584c91935c89546c",
    royalties: 1000
};


describe("Chaos E2E", function () {
    let accounts: SignerWithAddress[];
    let chaosSongs: ChaosSongs;
    let packContract: ChaosPacks;
    let splitContract: SplitMain;

    let nftTokenFactory: ChaosSongs__factory;
    let splitFactory: SplitMain__factory;
    let packFactory: ChaosPacks__factory;

    this.beforeAll(async function () {
        accounts = await ethers.getSigners();
        nftTokenFactory = (await ethers.getContractFactory(
            "ChaosSongs",
            accounts[0]
        )) as ChaosSongs__factory;

        splitFactory = (await ethers.getContractFactory(
            "SplitMain",
            accounts[0]
        )) as SplitMain__factory;

        packFactory = (await ethers.getContractFactory(
            "ChaosPacks",
            accounts[0]
        )) as ChaosPacks__factory;
    });

    beforeEach(async function () {

        packContract = await packFactory.deploy(
            config.baseUri,
            config.contractUri,
            5000,
            5000,
            accounts[0].address
        );

        splitContract = await splitFactory.deploy();

        chaosSongs = await nftTokenFactory.deploy(
            config.baseUri,
            config.contractUri,
            splitContract.address,
            config.royalties,
            config.distributorFee
        );

        await chaosSongs.setPackContract(packContract.address);
        await packContract.setSongContract(chaosSongs.address);

        await chaosSongs.mintSupercharged(
            accounts[0].address,
            config.supercharged
        );
        await chaosSongs.setSuperchargedOffset();
    });

    it("Should offset the token IDs", async function () {
        await packContract.mintReserve(5000, accounts[0].address)
        expect(await packContract.balanceOf(accounts[0].address)).to.equal(5000);
        for (let index = 1; index <= 5000; index++) {
            const tx = await chaosSongs.openPack(index);
            const receipt = await tx.wait();
            const gasUsed = receipt.gasUsed;
            console.log({ index, gasUsed });
        }
        expect(await packContract.balanceOf(accounts[0].address)).to.equal(0);
        expect(await chaosSongs.balanceOf(accounts[0].address)).to.equal(20000);
    });

});
