import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { deployments, ethers } from "hardhat";

import { addresses } from "./addresses";

import { ChaosSongs, ChaosSongs__factory } from "../typechain";

const config = {
    baseUri: "https://placeholder.com/{}.json",
    contractUri: "https://placeholder.com/contract.json",
    supercharged: 10,
    distributorFee: 0,
    recipient: '0xd1ed25240ecfa47fD2d46D34584c91935c89546c'
};

let thousandAddresses = addresses

describe("Chaos Packs", function () {
    let accounts: SignerWithAddress[];
    let nftTokenContract: ChaosSongs;

    beforeEach(async function () {
        accounts = await ethers.getSigners();

        const nftTokenFactory = (await ethers.getContractFactory(
            "ChaosSongs",
            accounts[0]
        )) as ChaosSongs__factory;

        nftTokenContract = await nftTokenFactory.deploy(
            config.baseUri,
            config.contractUri,
            config.supercharged,
            accounts[0].address,
            config.distributorFee
        );
    });

    it("Should allow reserve minting", async function () {
        await nftTokenContract.mintSupercharged(
            config.recipient
        );
        expect(await nftTokenContract.ownerOf(1)).to.equal(
            config.recipient
        );
        expect(await nftTokenContract.superchargeBalances(config.recipient)).to.equal(
            1
        );
    });
    
    it.skip("Should allow liquid splits distributions in worst case", async function () {
        for (let index = 0; index < thousandAddresses.length; index++) {
            await nftTokenContract.mintSupercharged(thousandAddresses[index])
        }
        await accounts[0].sendTransaction({to: nftTokenContract.address, value: ethers.utils.parseEther('10')})
        await nftTokenContract.distributeETH(thousandAddresses, accounts[0].address)
    });
    it("Should allow liquid splits distributions in semi worst case", async function () {
        const fivehundredaddresses = thousandAddresses.slice(-500)
        for (let index = 0; index < fivehundredaddresses.length; index++) {
            await nftTokenContract.mintSupercharged(fivehundredaddresses[index])
            await nftTokenContract.mintSupercharged(fivehundredaddresses[index])
        }
        await accounts[0].sendTransaction({to: nftTokenContract.address, value: ethers.utils.parseEther('10')})
        await nftTokenContract.distributeETH(fivehundredaddresses, accounts[0].address)
    });
});
