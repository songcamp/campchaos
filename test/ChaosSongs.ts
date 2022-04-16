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

describe("Chaos Songs", function () {
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
        await packContract.setOwner(accounts[1].address);

        splitContract = await splitFactory.deploy();

        nftTokenContract = await nftTokenFactory.deploy(
            config.baseUri,
            config.contractUri,
            splitContract.address,
            config.distributorFee
        );

        await nftTokenContract.setPackContract(packContract.address);

        await nftTokenContract.mintSupercharged(
            accounts[0].address,
            config.supercharged
        );
        await nftTokenContract.setSuperchargedOffset();
    });
    
    // Pack opening - Avoids collisions
    
    // Pack opening - assigns offset to group of 4 songs
    
    // Constructor - sets up splits
    
    // Pack opening - fails if burn fails
    
    // Token URI - correctly assigns shuffled token ID for normal NFT

    // Token URI - correctly assigns shuffled token ID for supercharged NFT
    
    // Supercharged - tracks balance of supercharged
    
    // Supercharged - allows minting up to limit by owner
    
    // Supercharged - does not allow otehrs to mint
    
    // Supercharged offests - allows to set once
    
    // Distribute ETH - sends ETH to splits contract
    
    // Token IDS - starts at 1
    
    // Access control - set pack contract
    
    // Access control - URIs
    
    // Access control - fees
    
    
    
    //
    
    describe.only("Pack opening", function () {
        this.beforeEach(async function() {
            nftTokenContract = nftTokenContract.connect(accounts[1])
        })
        it("Should Mint 4 NFTs on pack open", async function () {
            expect(await nftTokenContract.balanceOf(accounts[1].address)).to.equal(0)
            await nftTokenContract.openPack(1);
            expect(await nftTokenContract.balanceOf(accounts[1].address)).to.equal(4)
        });

        it("Should Mint 4 consecutive token IDs", async function () {
            await nftTokenContract.openPack(1);
            expect(await nftTokenContract.ownerOf(1000)).to.equal(accounts[1].address)
            expect(await nftTokenContract.ownerOf(1001)).to.equal(accounts[1].address)
            expect(await nftTokenContract.ownerOf(1002)).to.equal(accounts[1].address)
            expect(await nftTokenContract.ownerOf(1003)).to.equal(accounts[1].address)
        });
        it("Should set a nonzero offset for the first token", async function () {
            await nftTokenContract.openPack(1);
            expect(await nftTokenContract.offsets(1000)).to.be.gt(0)
            expect(await nftTokenContract.offsets(1001)).to.equal(0)
            expect(await nftTokenContract.offsets(1002)).to.equal(0)
            expect(await nftTokenContract.offsets(1003)).to.equal(0)
        });
        it("Should use the offset to shuffle the token ID", async function () {
            await nftTokenContract.openPack(1);
            const offset = await nftTokenContract.offsets(1000)
            console.log({offset})
            const songId = await nftTokenContract.getSongTokenId(1000)
            console.log({songId})

            // TODO make a mock to explicitly test shuffled token ID logic
            expect(await nftTokenContract.getSongTokenId(1000)).to.equal(offset.mul(4).add(1000))
            expect(await nftTokenContract.getSongTokenId(1001)).to.equal(offset.mul(4).add(1000).add(1))
            expect(await nftTokenContract.getSongTokenId(1002)).to.equal(offset.mul(4).add(1000).add(2))
            expect(await nftTokenContract.getSongTokenId(1003)).to.equal(offset.mul(4).add(1000).add(3))

            await nftTokenContract.openPack(1);
            const offset2 = await nftTokenContract.offsets(1004)
            expect(await nftTokenContract.getSongTokenId(1004)).to.equal(offset2.mul(4).add(1000))
            expect(await nftTokenContract.getSongTokenId(1005)).to.equal(offset2.mul(4).add(1000).add(1))
            expect(await nftTokenContract.getSongTokenId(1006)).to.equal(offset2.mul(4).add(1000).add(2))
            expect(await nftTokenContract.getSongTokenId(1007)).to.equal(offset2.mul(4).add(1000).add(3))
        });

    })

    it.skip("Should offset the token IDs", async function () {
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
