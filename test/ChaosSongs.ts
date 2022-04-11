import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { deployments, ethers } from "hardhat";

import { addresses } from "./addresses";

import {
    ChaosSongs,
    ChaosSongs__factory,
    SplitMain,
    SplitMain__factory,
    MockChaosPacks,
    MockChaosPacks__factory,
} from "../typechain";

const config = {
    baseUri: "https://placeholder.com/{}.json",
    contractUri: "https://placeholder.com/contract.json",
    supercharged: 1000,
    distributorFee: 0,
    recipient: "0xd1ed25240ecfa47fD2d46D34584c91935c89546c",
};

let thousandAddresses = addresses;

describe.only("Chaos Songs", function () {
    let accounts: SignerWithAddress[];
    let nftTokenContract: ChaosSongs;
    let splitContract: SplitMain;

    beforeEach(async function () {
        accounts = await ethers.getSigners();

        const nftTokenFactory = (await ethers.getContractFactory(
            "ChaosSongs",
            accounts[0]
        )) as ChaosSongs__factory;

        const splitFactory = (await ethers.getContractFactory(
            "SplitMain",
            accounts[0]
        )) as SplitMain__factory;

        const packFactory = (await ethers.getContractFactory(
            "MockChaosPacks",
            accounts[0]
        )) as MockChaosPacks__factory;
        const packContract = await packFactory.deploy();
        await packContract.setOwner(accounts[0].address);

        splitContract = await splitFactory.deploy();

        nftTokenContract = await nftTokenFactory.deploy(
            config.baseUri,
            config.contractUri,
            splitContract.address,
            config.distributorFee
        );

        await nftTokenContract.setPackContract(packContract.address);

        console.log(await nftTokenContract.unclaimed(0));

        await nftTokenContract.mintSupercharged(
            accounts[0].address,
            config.supercharged
        );
        await nftTokenContract.setSuperchargedOffset();
    });

    it.only("Should offset the token IDs", async function () {
        for (let index = 0; index < 5000; index++) {
            const tx = await nftTokenContract.openPack(1);
            const receipt = await tx.wait();
            const gasUsed = receipt.gasUsed;
            console.log({ index, gasUsed });
        }
        expect(await nftTokenContract.balanceOf(accounts[0].address)).to.equal(
            20000
        );
    });

    it.skip("Should allow reserve minting", async function () {
        await nftTokenContract.mintSupercharged(config.recipient, 1);
        expect(await nftTokenContract.ownerOf(1)).to.equal(config.recipient);
        expect(
            await nftTokenContract.superchargeBalances(config.recipient)
        ).to.equal(1);
    });

    it.skip("Should allow liquid splits distributions in worst case", async function () {
        for (let index = 0; index < thousandAddresses.length; index++) {
            await nftTokenContract.mintSupercharged(
                thousandAddresses[index],
                1
            );
        }
        await accounts[0].sendTransaction({
            to: nftTokenContract.address,
            value: ethers.utils.parseEther("10"),
        });
        await nftTokenContract.distributeETH(
            thousandAddresses,
            accounts[0].address
        );
    });
    it.skip("Should allow liquid splits distributions in semi worst case", async function () {
        const fivehundredaddresses = thousandAddresses.slice(-500);
        for (let index = 0; index < fivehundredaddresses.length; index++) {
            await nftTokenContract.mintSupercharged(
                fivehundredaddresses[index],
                2
            );
        }
        await accounts[0].sendTransaction({
            to: nftTokenContract.address,
            value: ethers.utils.parseEther("10"),
        });
        await nftTokenContract.distributeETH(
            fivehundredaddresses,
            accounts[0].address
        );
    });
    it.skip("Should allow liquid splits distributions in semi worst case twice", async function () {
        const fivehundredaddresses = thousandAddresses.slice(-100);
        for (let index = 0; index < fivehundredaddresses.length; index++) {
            await nftTokenContract.mintSupercharged(
                fivehundredaddresses[index],
                10
            );
        }
        await accounts[0].sendTransaction({
            to: nftTokenContract.address,
            value: ethers.utils.parseEther("10"),
        });
        await nftTokenContract.distributeETH(
            fivehundredaddresses,
            accounts[0].address
        );
        await accounts[0].sendTransaction({
            to: nftTokenContract.address,
            value: ethers.utils.parseEther("10"),
        });
        await nftTokenContract.distributeETH(
            fivehundredaddresses,
            accounts[0].address
        );
    });
    it.skip("Should allow liquid splits distributions in expected case", async function () {
        const onehundredaddresses = thousandAddresses.slice(-100);
        for (let index = 0; index < onehundredaddresses.length; index++) {
            await nftTokenContract.mintSupercharged(
                onehundredaddresses[index],
                10
            );
        }
        await accounts[0].sendTransaction({
            to: nftTokenContract.address,
            value: ethers.utils.parseEther("10"),
        });
        await nftTokenContract.distributeETH(
            onehundredaddresses,
            accounts[0].address
        );
    });
});
