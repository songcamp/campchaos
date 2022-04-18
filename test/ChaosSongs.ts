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
import { BaseProvider } from "@ethersproject/providers";

const config = {
    baseUri: "https://placeholder.com/",
    contractUri: "https://placeholder.com/contract.json",
    supercharged: 1000,
    distributorFee: 0,
    recipient: "0xd1ed25240ecfa47fD2d46D34584c91935c89546c",
    royalties: 1000,
};

let thousandAddresses = addresses;

describe("Chaos Songs", function () {
    let provider: BaseProvider;
    let accounts: SignerWithAddress[];
    let nftTokenContract: ChaosSongs;
    let splitContract: SplitMain;
    let packContract: MockChaosPacks;

    let nftTokenFactory: ChaosSongs__factory;
    let splitFactory: SplitMain__factory;
    let packFactory: MockChaosPacks__factory;

    this.beforeAll(async function () {
        accounts = await ethers.getSigners();
        provider = ethers.provider;
        nftTokenFactory = (await ethers.getContractFactory(
            "ChaosSongs",
            accounts[0]
        )) as ChaosSongs__factory;

        splitFactory = (await ethers.getContractFactory(
            "SplitMain",
            accounts[0]
        )) as SplitMain__factory;

        packFactory = (await ethers.getContractFactory(
            "MockChaosPacks",
            accounts[0]
        )) as MockChaosPacks__factory;
    });

    beforeEach(async function () {
        packContract = await packFactory.deploy();
        await packContract.setOwner(accounts[1].address);

        splitContract = await splitFactory.deploy();

        nftTokenContract = await nftTokenFactory.deploy(
            config.baseUri,
            config.contractUri,
            splitContract.address,
            config.royalties,
            config.distributorFee
        );

        await nftTokenContract.setPackContract(packContract.address);
    });

    // Constructor - sets up splits

    // Distribute ETH - sends ETH to splits contract

    // Access control - set pack contract

    describe("Pack opening", function () {
        this.beforeEach(async function () {
            await nftTokenContract.mintSupercharged(
                accounts[0].address,
                config.supercharged
            );
            await nftTokenContract.setSuperchargedOffset();
            nftTokenContract = nftTokenContract.connect(accounts[1]);
        });
        it("Does not allow opening by non owner of pack", async function () {
            nftTokenContract = await nftTokenContract.connect(
                accounts[2]
            );
            await expect(nftTokenContract.openPack(1)).to.be.revertedWith(
                "CallerIsNotTokenOwner()"
            );
        });
        it("Should Mint 4 NFTs on pack open", async function () {
            expect(
                await nftTokenContract.balanceOf(accounts[1].address)
            ).to.equal(0);
            await nftTokenContract.openPack(1);
            expect(
                await nftTokenContract.balanceOf(accounts[1].address)
            ).to.equal(4);
        });

        it("Returns concatenated token URI", async function () {
            await nftTokenContract.openPack(1);
            const shuffledId = await nftTokenContract.getSongTokenId(1001);
            expect(await nftTokenContract.tokenURI(1001)).to.equal(
                config.baseUri + shuffledId.toString() + ".json"
            );
        });

        it("Should Mint 4 consecutive token IDs", async function () {
            await nftTokenContract.openPack(1);
            expect(await nftTokenContract.ownerOf(1000)).to.equal(
                accounts[1].address
            );
            expect(await nftTokenContract.ownerOf(1001)).to.equal(
                accounts[1].address
            );
            expect(await nftTokenContract.ownerOf(1002)).to.equal(
                accounts[1].address
            );
            expect(await nftTokenContract.ownerOf(1003)).to.equal(
                accounts[1].address
            );
        });
        it("Fails if burn fails", async function () {
            await packContract.disableBurn(true);
            await expect(nftTokenContract.openPack(1)).to.be.reverted;
        });
        it("Fails if burn does not return true", async function () {
            await packContract.makeBurnSucceed(false);
            await expect(nftTokenContract.openPack(1)).to.be.revertedWith(
                "BurnPackFailed()"
            );
        });
        it("Should set a nonzero offset for the first token", async function () {
            await nftTokenContract.openPack(1);
            if ((await nftTokenContract.offsets(1000)).eq(0)) {
                // Small chance that offset is actually 0, in that case open another one
                await nftTokenContract.openPack(1);
            }
            expect(await nftTokenContract.offsets(1000)).to.be.gt(0);
            expect(await nftTokenContract.offsets(1001)).to.equal(0);
            expect(await nftTokenContract.offsets(1002)).to.equal(0);
            expect(await nftTokenContract.offsets(1003)).to.equal(0);
        });
        it("Should use the offset to shuffle the token ID", async function () {
            await nftTokenContract.openPack(1);
            const offset = await nftTokenContract.offsets(1000);

            expect(await nftTokenContract.getSongTokenId(1000)).to.equal(
                offset.mul(4).add(1000)
            );
            expect(await nftTokenContract.getSongTokenId(1001)).to.equal(
                offset.mul(4).add(1000).add(1)
            );
            expect(await nftTokenContract.getSongTokenId(1002)).to.equal(
                offset.mul(4).add(1000).add(2)
            );
            expect(await nftTokenContract.getSongTokenId(1003)).to.equal(
                offset.mul(4).add(1000).add(3)
            );

            await nftTokenContract.openPack(1);
            const offset2 = await nftTokenContract.offsets(1004);
            expect(await nftTokenContract.getSongTokenId(1004)).to.equal(
                offset2.mul(4).add(1000)
            );
            expect(await nftTokenContract.getSongTokenId(1005)).to.equal(
                offset2.mul(4).add(1000).add(1)
            );
            expect(await nftTokenContract.getSongTokenId(1006)).to.equal(
                offset2.mul(4).add(1000).add(2)
            );
            expect(await nftTokenContract.getSongTokenId(1007)).to.equal(
                offset2.mul(4).add(1000).add(3)
            );
        });

        it("Allows songs to be burned", async function () {
            await nftTokenContract.openPack(1);
            await nftTokenContract.burn(1000);
            await expect(nftTokenContract.ownerOf(1000)).to.be.revertedWith(
                "OwnerQueryForNonexistentToken()"
            );
        });
    });

    describe("Supercharged Setup", function () {
        it("Does not allow pack opening if supercharged are not minted", async function () {
            nftTokenContract = nftTokenContract.connect(accounts[1]);
            await expect(nftTokenContract.openPack(1)).to.be.revertedWith(
                "PacksDisabledUntilSuperchargedComplete()"
            );
        });
        it("Does not allow pack opening if supercharged offset is not set", async function () {
            await nftTokenContract.mintSupercharged(
                accounts[0].address,
                config.supercharged
            );
            nftTokenContract = nftTokenContract.connect(accounts[1]);
            await expect(nftTokenContract.openPack(1)).to.be.revertedWith(
                "PacksDisabledUntilSuperchargedComplete()"
            );
        });
        it("Fails to get song ID if offset not set", async function () {
            await nftTokenContract.mintSupercharged(
                accounts[0].address,
                config.supercharged
            );
            await expect(
                nftTokenContract.getSongTokenId(50)
            ).to.be.revertedWith("SuperchargedOffsetNotSet()");
        });
        it("Allows owner to mint up to limit", async function () {
            await nftTokenContract.mintSupercharged(accounts[1].address, 500);
            await nftTokenContract.mintSupercharged(accounts[2].address, 500);
            expect(
                await nftTokenContract.balanceOf(accounts[1].address)
            ).to.equal(500);
            expect(
                await nftTokenContract.balanceOf(accounts[2].address)
            ).to.equal(500);
            expect(
                await nftTokenContract.superchargeBalances(accounts[1].address)
            ).to.equal(500);
            expect(
                await nftTokenContract.superchargeBalances(accounts[2].address)
            ).to.equal(500);
        });
        it("Allows owner to mint up to limit in batch", async function () {
            await nftTokenContract.batchMintSupercharged(
                [accounts[1].address, accounts[2].address],
                [500, 500]
            );
            expect(
                await nftTokenContract.balanceOf(accounts[1].address)
            ).to.equal(500);
            expect(
                await nftTokenContract.balanceOf(accounts[2].address)
            ).to.equal(500);
            expect(
                await nftTokenContract.superchargeBalances(accounts[1].address)
            ).to.equal(500);
            expect(
                await nftTokenContract.superchargeBalances(accounts[2].address)
            ).to.equal(500);
        });
        it("Does not allow owner to mint past max in batch", async function () {
            await expect(
                nftTokenContract.batchMintSupercharged(
                    [accounts[1].address, accounts[2].address],
                    [500, 501]
                )
            ).to.be.revertedWith("MaxSupplyExceeded()");
        });
        it("Fails if array lengths are mismatched", async function () {
            await expect(
                nftTokenContract.batchMintSupercharged(
                    [accounts[1].address, accounts[2].address],
                    [500]
                )
            ).to.be.revertedWith("LengthMismatch()");
        });
        it("Does not allow anyone else to mint in batch", async function () {
            nftTokenContract = await nftTokenContract.connect(accounts[1]);
            await expect(
                nftTokenContract.batchMintSupercharged(
                    [accounts[1].address, accounts[1].address],
                    [500, 500]
                )
            ).to.be.revertedWith("Ownable: caller is not the owner");
        });
        it("Starts token IDs at 0", async function () {
            await nftTokenContract.mintSupercharged(accounts[1].address, 1000);
            expect(await nftTokenContract.ownerOf(0)).to.equal(
                accounts[1].address
            );
            expect(await nftTokenContract.ownerOf(999)).to.equal(
                accounts[1].address
            );
            await expect(nftTokenContract.ownerOf(1000)).to.be.revertedWith(
                "OwnerQueryForNonexistentToken()"
            );
        });
        it("Does not allow minting past max", async function () {
            await expect(
                nftTokenContract.mintSupercharged(accounts[1].address, 1001)
            ).to.be.revertedWith("MaxSupplyExceeded()");
            await nftTokenContract.mintSupercharged(
                accounts[0].address,
                config.supercharged
            );
            await expect(
                nftTokenContract.mintSupercharged(accounts[1].address, 1)
            ).to.be.revertedWith("MaxSupplyExceeded()");
            await expect(
                nftTokenContract.mintSupercharged(accounts[1].address, 5)
            ).to.be.revertedWith("MaxSupplyExceeded()");
        });
        it("Does not allow supercharged minting by non owner", async function () {
            nftTokenContract = await nftTokenContract.connect(accounts[1]);
            await expect(
                nftTokenContract.mintSupercharged(
                    accounts[0].address,
                    config.supercharged
                )
            ).to.be.revertedWith("Ownable: caller is not the owner");
        });
        it("Does not allow supercharged offset to be set if not minted", async function () {
            await expect(
                nftTokenContract.setSuperchargedOffset()
            ).to.be.revertedWith("SuperchargeConfigurationNotReady()");
        });
        it("Does not allow supercharged offset to be set if already set", async function () {
            await nftTokenContract.mintSupercharged(
                accounts[0].address,
                config.supercharged
            );
            await nftTokenContract.setSuperchargedOffset();
            await expect(
                nftTokenContract.setSuperchargedOffset()
            ).to.be.revertedWith("SuperchargedOffsetAlreadySet()");
        });
    });

    describe("Supercharged Offsets", function () {
        let offset: number;
        this.beforeEach(async function () {
            await nftTokenContract.mintSupercharged(
                accounts[0].address,
                config.supercharged
            );
            await nftTokenContract.setSuperchargedOffset();
            offset = (await nftTokenContract.superchargedOffset()).toNumber();
        });
        it("Offsets supercharged ID correctly when below supply", async function () {
            const tokenId = 0;
            const predictedId = tokenId + offset;
            const shuffledId = await nftTokenContract.getSongTokenId(tokenId);
            expect(shuffledId).to.equal(predictedId);
        });
        it("Offsets supercharged ID correctly when above supply", async function () {
            const tokenId = 999;
            const predictedId = tokenId + offset - config.supercharged;
            const shuffledId = await nftTokenContract.getSongTokenId(tokenId);
            expect(shuffledId).to.equal(predictedId);
        });
        it("Returns concatenated token URI", async function () {
            const shuffledId = await nftTokenContract.getSongTokenId(50);
            expect(await nftTokenContract.tokenURI(50)).to.equal(
                config.baseUri + shuffledId.toString() + ".json"
            );
        });
    });

    describe("Supercharged Balances", function () {
        this.beforeEach(async function () {
            await nftTokenContract.mintSupercharged(
                accounts[0].address,
                config.supercharged
            );
            await nftTokenContract.setSuperchargedOffset();
        });
        it("Tracks supercharged balances when tokens are transferred", async function () {
            const superBalance0 = await nftTokenContract.superchargeBalances(
                accounts[0].address
            );
            expect(superBalance0).to.equal(1000);
            await nftTokenContract.transferFrom(
                accounts[0].address,
                accounts[1].address,
                0
            );
            await nftTokenContract.transferFrom(
                accounts[0].address,
                accounts[1].address,
                1
            );
            await nftTokenContract.transferFrom(
                accounts[0].address,
                accounts[1].address,
                10
            );

            expect(
                await nftTokenContract.superchargeBalances(accounts[0].address)
            ).to.equal(997);
            expect(
                await nftTokenContract.superchargeBalances(accounts[1].address)
            ).to.equal(3);
        });
        it("Does not allow supercharged tokens to be burned", async function () {
            await expect(nftTokenContract.burn(1)).to.be.reverted; // todo error message
        });
    });

    describe("Liquid splits", function () {
        it("Should allow liquid splits distributions in expected case", async function () {
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

    describe("Royalties", function () {
        it("Allows the contract to receive royalties", async function () {
            const balanceBefore = await provider.getBalance(
                nftTokenContract.address
            );
            await accounts[0].sendTransaction({
                to: nftTokenContract.address,
                value: ethers.utils.parseEther("10"),
            });
            const balanceAfter = await provider.getBalance(
                nftTokenContract.address
            );

            expect(
                balanceAfter
                    .sub(balanceBefore)
                    .eq(ethers.utils.parseEther("10"))
            ).to.be.true;
        });
        it("Exposes 2981 interface to send royalties to contract", async function () {
            const royalties = await nftTokenContract.royaltyInfo(
                1,
                ethers.utils.parseEther("10")
            );
            expect(royalties._receiver).to.equal(nftTokenContract.address);
            expect(royalties._royaltyAmount.eq(ethers.utils.parseEther("1"))).to
                .be.true;
        });
    });

    describe("Configuration & Access Control", function () {
        it("Allows owner to set distributor fee", async function () {
            expect(await nftTokenContract.distributorFee()).to.equal(0);
            await nftTokenContract.setDistributorFee(100);
            expect(await nftTokenContract.distributorFee()).to.equal(100);
        });
        it("Does not allow anyone else to set distributor fee", async function () {
            nftTokenContract = await nftTokenContract.connect(accounts[1]);
            await expect(
                nftTokenContract.setDistributorFee(100)
            ).to.be.revertedWith("Ownable: caller is not the owner");
        });
        it("Allows owner to set royalty points", async function () {
            expect(await nftTokenContract.royaltyPoints()).to.equal(1000);
            await nftTokenContract.setRoyaltyPoints(100);
            expect(await nftTokenContract.royaltyPoints()).to.equal(100);
        });
        it("Does not allow anyone else to set royalty poinst", async function () {
            nftTokenContract = await nftTokenContract.connect(accounts[1]);
            await expect(
                nftTokenContract.setRoyaltyPoints(100)
            ).to.be.revertedWith("Ownable: caller is not the owner");
        });
        it("Allows owner to set pack contract", async function () {
            expect(await nftTokenContract.packContract()).to.equal(
                packContract.address
            );
            await nftTokenContract.setPackContract(accounts[2].address);
            expect(await nftTokenContract.packContract()).to.equal(
                accounts[2].address
            );
        });
        it("Does not allow anyone else to set pack contract", async function () {
            nftTokenContract = await nftTokenContract.connect(accounts[1]);
            await expect(
                nftTokenContract.setPackContract(accounts[2].address)
            ).to.be.revertedWith("Ownable: caller is not the owner");
        });
        it("Fails to return song ID if token ID does not exist", async function () {
            await expect(
                nftTokenContract.getSongTokenId(500)
            ).to.be.revertedWith("URIQueryForNonexistentToken()");
            await expect(
                nftTokenContract.getSongTokenId(2000)
            ).to.be.revertedWith("URIQueryForNonexistentToken()");
        });
        it("Fails to return token URI if token non existent", async function () {
            await expect(nftTokenContract.tokenURI(500)).to.be.revertedWith(
                "URIQueryForNonexistentToken()"
            );
            await expect(nftTokenContract.tokenURI(2000)).to.be.revertedWith(
                "URIQueryForNonexistentToken()"
            );
        });
        it("Allows owner to set contract URI", async function () {
            expect(await nftTokenContract.contractURI()).to.equal(
                config.contractUri
            );
            await nftTokenContract.setContractURI("new");
            expect(await nftTokenContract.contractURI()).to.equal("new");
        });
        it("Does not allow anyone else to set contract URI", async function () {
            nftTokenContract = await nftTokenContract.connect(accounts[1]);
            await expect(
                nftTokenContract.setContractURI("new")
            ).to.be.revertedWith("Ownable: caller is not the owner");
        });
        it("Allows owner to set base URI", async function () {
            expect(await nftTokenContract.baseURI()).to.equal(config.baseUri);
            await nftTokenContract.setBaseURI("new");
            expect(await nftTokenContract.baseURI()).to.equal("new");
        });
        it("Allows owner to set base URI after minting supercharged", async function () {
            expect(await nftTokenContract.baseURI()).to.equal(config.baseUri);
            await nftTokenContract.mintSupercharged(accounts[1].address, 1000);
            await nftTokenContract.setBaseURI("new");
            expect(await nftTokenContract.baseURI()).to.equal("new");
        });
        it("Does not allow anyone else to set base URI", async function () {
            nftTokenContract = await nftTokenContract.connect(accounts[1]);
            await expect(
                nftTokenContract.setContractURI("new")
            ).to.be.revertedWith("Ownable: caller is not the owner");
        });
        it("Does not allow anyone owner to set base URI after supercharged offset is set", async function () {
            await nftTokenContract.mintSupercharged(accounts[1].address, 1000);
            await nftTokenContract.setSuperchargedOffset();
            await expect(nftTokenContract.setBaseURI("new")).to.be.revertedWith(
                "SuperchargedOffsetAlreadySet()"
            );
        });
        it("Uses new base URI in token URI", async function () {
            expect(await nftTokenContract.baseURI()).to.equal(config.baseUri);
            await nftTokenContract.mintSupercharged(accounts[1].address, 1000);
            await nftTokenContract.setBaseURI("new");
            await nftTokenContract.setSuperchargedOffset();
            const shuffledId = await nftTokenContract.getSongTokenId(500);
            expect(await nftTokenContract.tokenURI(500)).to.equal(
                "new" + shuffledId + ".json"
            );
        });
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
});
