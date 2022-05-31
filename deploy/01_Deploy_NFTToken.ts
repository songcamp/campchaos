import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { ethers } from "hardhat";
import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

import {
    ChaosSongs,
    ChaosSongs__factory,
    SplitMain,
    SplitMain__factory,
    ChaosPacks,
    ChaosPacks__factory,
} from "../typechain";

const config = {
    packBaseUri: "ipfs://bafybeidsyei2e73aabn233wbbzxbpvusid2bl3z7lgkoazvhmpncpaexdm/",
    songBaseUri: "ipfs://bafybeielqdrobwou4elkevni4ja4tcepmbidc7oddst77ka7ebngcrrvou/",
    songContractUri: "ipfs://QmV2BEKnud4waoQgknzBWvFmwCqEKc5vu2Efh1WbGpfNSL",
    packContractUri: "ipfs://Qmb8UYuw3ufDhyYr1ERq86afR2TSmfYCvgZVeHQuawoH6t",
    supercharged: 1000,
    distributorFee: 0,
    recipient: "0xd1ed25240ecfa47fD2d46D34584c91935c89546c",
    royalties: 750,
    ropstenSplit: "0x2ed6c4B5dA6378c7897AC67Ba9e43102Feb694EE"
};

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    let accounts: SignerWithAddress[];
    let chaosSongs: ChaosSongs;
    let packContract: ChaosPacks;
    let splitContract: SplitMain;

    let nftTokenFactory: ChaosSongs__factory;
    let splitFactory: SplitMain__factory;
    let packFactory: ChaosPacks__factory;


    accounts = await hre.ethers.getSigners();

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

    console.log(await accounts[0].getAddress());

        packContract = await packFactory.deploy(
            config.packBaseUri,
            config.packContractUri,
            230,
            5000,
            config.royalties,
            accounts[0].address
        );
        
        console.log({packContract})

        // splitContract = await splitFactory.deploy();
        
        // await splitContract.deployed()

        chaosSongs = await nftTokenFactory.deploy(
            config.songBaseUri,
            config.songContractUri,
            config.ropstenSplit,
            config.royalties,
            config.distributorFee
        );
        
        await chaosSongs.deployed()

        const tx1 = await chaosSongs.setPackContract(packContract.address);
        await tx1.wait()
        const tx2 = await packContract.setSongContract(chaosSongs.address);
        await tx2.wait()

        // const tx3 = await chaosSongs.mintSupercharged(
        //     accounts[0].address,
        //     config.supercharged
        // );
        
        // await tx3.wait()
        // const tx4 = await chaosSongs.setSuperchargedOffset();
        
        // await tx4.wait()
        
        // const tx5 = await packContract.setSaleEnabled(true)
        // await tx5.wait()
        
        console.log({
            packContract: packContract.address,
            // splitContract: splitContract.address,
            chaosSongs: chaosSongs.address
        })


    console.log("Configured...");
};
export default func;
func.id = "nft_token_deploy";
func.tags = ["local"];
