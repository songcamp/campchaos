import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { BaseProvider } from "@ethersproject/providers";

import {
    ChaosPacks,
    ChaosPacks__factory,
    BatchMinter,
    BatchMinter__factory,
} from "../typechain";

const config = {
    baseUri: "https://placeholder.com/",
    contractUri: "https://placeholder.com/contract.json",
    reserved: 10,
    public: 150,
    sinkAddress: "0x000000000000000000000000000000000000dEaD",
    songAddress: "0x000000000000000000000000000000000000bEEF",
    royalties: 1000,
};

describe.only("Chaos Packs", function () {
    let accounts: SignerWithAddress[];
    let nftTokenFactory: ChaosPacks__factory;
    let nftTokenContract: ChaosPacks;
    let batchMinter: BatchMinter;
    let provider: BaseProvider;

    const price = ethers.utils.parseEther("0.2");

    this.beforeAll(async function () {
        provider = ethers.provider;
        accounts = await ethers.getSigners();

        nftTokenFactory = (await ethers.getContractFactory(
            "ChaosPacks",
            accounts[0]
        )) as ChaosPacks__factory;
    });

    beforeEach(async function () {
        nftTokenContract = await nftTokenFactory.deploy(
            config.baseUri,
            config.contractUri,
            config.reserved,
            config.public,
            config.royalties,
            config.sinkAddress
        );
        await nftTokenContract.setSongContract(config.songAddress);
    });

    describe("Configuration", function () {
        it("Should setup tests", async function () {
            expect(await nftTokenContract.saleEnabled()).to.be.equal(false);
        });
    });

    describe("Receive ETH", function () {
        this.beforeEach(async function () {
            await nftTokenContract.setSaleEnabled(true);
        });
        it("Fails if receiver cannot receive eth", async function () {
            const NonReceiver = await ethers.getContractFactory("NonReceiver");

            const nonReceiver = await NonReceiver.deploy();

            await nftTokenContract.setSaleEnabled(true);
            await nftTokenContract.setSink(nonReceiver.address);

            await nftTokenContract.purchase(1, { value: price });

            await expect(nftTokenContract.withdrawToSink()).to.be.revertedWith(
                "ETH_TRANSFER_FAILED"
            );
        });

        it("Should send eth to the sink", async function () {
            const balanceBefore = await provider.getBalance(config.sinkAddress);
            await nftTokenContract.purchase(1, {
                value: price,
            });
            await nftTokenContract.withdrawToSink();
            const balanceAfter = await provider.getBalance(config.sinkAddress);

            expect(balanceAfter.sub(balanceBefore).eq(price)).to.be.true;
        });
    });

    describe("Royalties", function () {
        it("Exposes 2981 interface to send royalties to contract", async function () {
            const royalties = await nftTokenContract.royaltyInfo(
                1,
                ethers.utils.parseEther("10")
            );

            expect(royalties._receiver).to.equal(config.songAddress);
            expect(royalties._royaltyAmount.eq(ethers.utils.parseEther("1"))).to
                .be.true;
        });
    });

    describe("Minting Public", function () {
        this.beforeEach(async function () {
            await nftTokenContract.setSaleEnabled(true);
        });
        it("Should allow anyone to mint when sale enabled", async function () {
            await nftTokenContract.purchase(1, { value: price });
            expect(
                await nftTokenContract.balanceOf(accounts[0].address)
            ).to.equal(1);
        });

        it("Fails if public sale not enabled", async function () {
            await nftTokenContract.setSaleEnabled(false);
            await expect(
                nftTokenContract.purchase(1, { value: price })
            ).to.be.revertedWith("SaleDisabled()");
        });

        it("Should fail if eth less than required amount", async function () {
            await expect(
                nftTokenContract.purchase(1, {
                    value: ethers.utils.parseEther("0.09"),
                })
            ).to.be.revertedWith("InvalidPurchaseValue()");
            expect(
                await nftTokenContract.balanceOf(accounts[0].address)
            ).to.equal(0);
        });

        it("Should fail if greater than required eth amount", async function () {
            await expect(
                nftTokenContract.purchase(1, {
                    value: ethers.utils.parseEther("0.3"),
                })
            ).to.be.revertedWith("InvalidPurchaseValue()");
        });

        it("Should fail if more than 100 attempted", async function () {
            const totalPrice = price.mul(101);

            await expect(
                nftTokenContract.purchase(101, { value: totalPrice })
            ).to.be.revertedWith("MaxPerTxExceeded()");
        });

        it("Should fail if more than total supply", async function () {
            nftTokenContract = await nftTokenContract.connect(accounts[3]);
            await nftTokenContract.purchase(100, { value: price.mul(100) });
            await nftTokenContract.purchase(50, { value: price.mul(50) });
            expect(
                await nftTokenContract.balanceOf(accounts[3].address)
            ).to.equal(150);
            expect(await nftTokenContract.totalSupply()).to.equal(150);
            await expect(
                nftTokenContract.purchase(1, { value: price })
            ).to.be.revertedWith("MaxSupplyExceeded()");
            console.log(await nftTokenContract.totalSupply());
        });
    });

    describe("Minting reserve", function () {
        it("Should allow the owner to mint reserve", async function () {
            await nftTokenContract.mintReserve(1, accounts[0].address);
            expect(
                await nftTokenContract.balanceOf(accounts[0].address)
            ).to.equal(1);
        });

        it("Does not allow anyone else to mint reserve", async function () {
            nftTokenContract = await nftTokenContract.connect(accounts[1]);
            await expect(
                nftTokenContract.mintReserve(1, accounts[1].address)
            ).to.be.revertedWith("Ownable: caller is not the owner");
        });

        it("Should allow the owner to batch mint reserve", async function () {
            await nftTokenContract.batchMintReserve(
                [accounts[0].address, accounts[1].address],
                [1, 2]
            );
            expect(
                await nftTokenContract.balanceOf(accounts[0].address)
            ).to.equal(1);
            expect(
                await nftTokenContract.balanceOf(accounts[1].address)
            ).to.equal(2);
        });

        it("Does not allow anyone else to batch mint reserve", async function () {
            nftTokenContract = await nftTokenContract.connect(accounts[1]);
            await expect(
                nftTokenContract.batchMintReserve([accounts[1].address], [1])
            ).to.be.revertedWith("Ownable: caller is not the owner");
        });

        it("Should allow owner to mint up to reserve cap", async function () {
            await nftTokenContract.mintReserve(10, accounts[0].address);
            expect(
                await nftTokenContract.balanceOf(accounts[0].address)
            ).to.equal(10);
        });

        it("Should not allow owner to mint more than reserve cap", async function () {
            await expect(
                nftTokenContract.mintReserve(11, accounts[0].address)
            ).to.be.revertedWith("MaxReserveExceeded()");
        });

        it("Should not allow owner to batch mint more than reserve cap", async function () {
            await expect(
                nftTokenContract.batchMintReserve([accounts[0].address], [11])
            ).to.be.revertedWith("MaxReserveExceeded()");
            await expect(
                nftTokenContract.batchMintReserve(
                    [accounts[0].address, accounts[1].address],
                    [5, 6]
                )
            ).to.be.revertedWith("MaxReserveExceeded()");
        });

        it("Should not allow owner to batch mint with mismatched arrays", async function () {
            await expect(
                nftTokenContract.batchMintReserve(
                    [accounts[0].address, accounts[1].address],
                    [9]
                )
            ).to.be.revertedWith("LengthMismatch()");
            await expect(
                nftTokenContract.batchMintReserve([accounts[0].address], [1, 2])
            ).to.be.revertedWith("LengthMismatch()");
        });

        it("Should not allow owner to mint more than total supply", async function () {
            await nftTokenContract.setSaleEnabled(true);
            await nftTokenContract.purchase(100, { value: price.mul(100) });
            await nftTokenContract.purchase(49, { value: price.mul(49) });
            await expect(
                nftTokenContract.mintReserve(2, accounts[0].address)
            ).to.be.revertedWith("MaxSupplyExceeded()");
        });
    });

    describe("Pack opening", function () {
        this.beforeEach(async function () {
            await nftTokenContract.setSongContract(accounts[0].address);
            await nftTokenContract.setSaleEnabled(true);
        });
        it("Allows song contract to burn NFTs", async function () {
            await nftTokenContract.mintReserve(5, accounts[0].address);
            expect(await nftTokenContract.totalSupply()).to.equal(5);
            await nftTokenContract.burnPack(0);
            expect(await nftTokenContract.totalSupply()).to.equal(4);
            await expect(nftTokenContract.tokenURI(0)).to.be.revertedWith(
                "URIQueryForNonexistentToken()"
            );
        });
        it("Does not allow anyone else to burn", async function () {
            await nftTokenContract.mintReserve(5, accounts[0].address);
            nftTokenContract = await nftTokenContract.connect(accounts[1]);
            await expect(nftTokenContract.burnPack(0)).to.be.revertedWith(
                "OnlySongContractCanBurn()"
            );
        });
    });

    describe("Access control", function () {
        it("Allows owner to change owner", async function () {
            await nftTokenContract.transferOwnership(accounts[1].address);
            expect(await nftTokenContract.owner()).to.equal(
                accounts[1].address
            );
        });
    });

    describe("Configuration", function () {
        it("Allows owner to set contract state", async function () {
            expect(await nftTokenContract.saleEnabled()).to.equal(false);
            await nftTokenContract.setSaleEnabled(true);
            expect(await nftTokenContract.saleEnabled()).to.equal(true);

            await nftTokenContract.setSaleEnabled(false);
            expect(await nftTokenContract.saleEnabled()).to.equal(false);
        });

        it("Allows owner to change baseUri", async function () {
            await nftTokenContract.mintReserve(1, accounts[0].address);
            expect(await nftTokenContract.tokenURI(0)).to.equal(
                "https://placeholder.com/0.json"
            );

            await nftTokenContract.setBaseURI("new:");
            expect(await nftTokenContract.baseURI()).to.equal("new:");

            expect(await nftTokenContract.tokenURI(0)).to.equal("new:0.json");
        });

        it("Does not allow anyone else to change base URI", async function () {
            nftTokenContract = await nftTokenContract.connect(accounts[1]);
            await expect(nftTokenContract.setBaseURI("new")).to.be.revertedWith(
                "Ownable: caller is not the owner"
            );
        });

        it("Allows owner to change baseUri", async function () {
            expect(await nftTokenContract.contractURI()).to.equal(
                config.contractUri
            );

            await nftTokenContract.setContractURI("new");
            expect(await nftTokenContract.contractURI()).to.equal("new");
        });

        it("Does not allow anyone else to change contract URI", async function () {
            nftTokenContract = await nftTokenContract.connect(accounts[1]);
            await expect(
                nftTokenContract.setContractURI("new")
            ).to.be.revertedWith("Ownable: caller is not the owner");
        });

        it("Allows owner to change song contract", async function () {
            expect(await nftTokenContract.songContract()).to.equal(
                config.songAddress
            );

            await nftTokenContract.setSongContract(config.sinkAddress);
            expect(await nftTokenContract.songContract()).to.equal(
                config.sinkAddress
            );
        });

        it("Allows owner to lock song contract", async function () {
            expect(await nftTokenContract.songContract()).to.equal(
                config.songAddress
            );
            await nftTokenContract.lockSongContract();
            await expect(
                nftTokenContract.setSongContract(accounts[2].address)
            ).to.be.revertedWith("SongContractLocked()");
        });

        it("Does not allow lock to be called if already locked", async function () {
            expect(await nftTokenContract.songContract()).to.equal(
                config.songAddress
            );
            await nftTokenContract.lockSongContract();
            await expect(
                nftTokenContract.lockSongContract()
            ).to.be.revertedWith("SongContractLocked()");
        });

        it("Does not allow anyone else to lock pack contract", async function () {
            nftTokenContract = await nftTokenContract.connect(accounts[1]);
            await expect(
                nftTokenContract.lockSongContract()
            ).to.be.revertedWith("Ownable: caller is not the owner");
        });

        it("Does not allow anyone else to change song contract", async function () {
            nftTokenContract = await nftTokenContract.connect(accounts[1]);
            await expect(
                nftTokenContract.setSongContract(config.sinkAddress)
            ).to.be.revertedWith("Ownable: caller is not the owner");
        });

        it("Allows owner to change sink", async function () {
            expect(await nftTokenContract.ethSink()).to.equal(
                config.sinkAddress
            );

            await nftTokenContract.setSink(config.songAddress);
            expect(await nftTokenContract.ethSink()).to.equal(
                config.songAddress
            );
        });

        it("Does not allow anyone else to change contract URI", async function () {
            nftTokenContract = await nftTokenContract.connect(accounts[1]);
            await expect(
                nftTokenContract.setSink(config.songAddress)
            ).to.be.revertedWith("Ownable: caller is not the owner");
        });

        it("Allows owner to set royalty points", async function () {
            expect(await nftTokenContract.royaltyPoints()).to.equal(1000);
            await nftTokenContract.setRoyaltyPoints(100);
            expect(await nftTokenContract.royaltyPoints()).to.equal(100);
        });

        it("Does not allow anyone else to set royalty points", async function () {
            nftTokenContract = await nftTokenContract.connect(accounts[1]);
            await expect(
                nftTokenContract.setRoyaltyPoints(100)
            ).to.be.revertedWith("Ownable: caller is not the owner");
        });
    });

    describe("Cooldown", function () {
        this.beforeAll(async function () {
            const batchMinterFactory = (await ethers.getContractFactory(
                "BatchMinter",
                accounts[0]
            )) as BatchMinter__factory;
            batchMinter = await batchMinterFactory.deploy();
        });

        this.beforeEach(async function () {
            await nftTokenContract.setSaleEnabled(true);
        });

        it("Allows contracts to mint 1 per block", async function () {
            await batchMinter.batchPurchase(nftTokenContract.address, 1, {
                value: price,
            });
            expect(
                await nftTokenContract.balanceOf(batchMinter.address)
            ).to.equal(1);
        });

        it("Does not allow contracts to mint multiple times per block", async function () {
            await expect(
                batchMinter.batchPurchase(nftTokenContract.address, 2, {
                    value: price.mul(2),
                })
            ).to.be.revertedWith("OnlyOneCallPerBlockForNonEOA()");
        });
    });
});
