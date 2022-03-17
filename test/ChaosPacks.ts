import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { deployments, ethers } from "hardhat";

import { ChaosPacks, ChaosPacks__factory } from "../typechain";

const config = {
    baseUri: "https://placeholder.com/{}.json",
    contractUri: "https://placeholder.com/contract.json",
    reserved: 10,
    presale: 50,
    public: 100,
};

describe("Chaos Packs", function () {
    let accounts: SignerWithAddress[];
    let nftTokenContract: ChaosPacks;

    beforeEach(async function () {
        accounts = await ethers.getSigners();

        const nftTokenFactory = (await ethers.getContractFactory(
            "ChaosPacks",
            accounts[0]
        )) as ChaosPacks__factory;

        nftTokenContract = await nftTokenFactory.deploy(
            config.baseUri,
            config.contractUri,
            config.reserved,
            config.presale,
            config.public,
            accounts[0].address
        );
    });

    it("Should allow reserve minting", async function () {
        await nftTokenContract.mintReserve(
            5,
            "0xd1ed25240ecfa47fD2d46D34584c91935c89546c"
        );
        expect(await nftTokenContract.ownerOf(1)).to.equal(
            "0xd1ed25240ecfa47fD2d46D34584c91935c89546c"
        );
    });
});
