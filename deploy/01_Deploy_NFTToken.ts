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
    baseUri: "https://placeholder.com/{}.json",
    contractUri: "https://placeholder.com/contract.json",
    supercharged: 1000,
    distributorFee: 0,
    recipient: "0xd1ed25240ecfa47fD2d46D34584c91935c89546c",
    royalties: 1000,
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
            config.baseUri,
            config.contractUri,
            5000,
            5000,
            accounts[0].address
        );
        
        console.log({packContract})

        splitContract = await splitFactory.deploy();
        
        await splitContract.deployed()

        chaosSongs = await nftTokenFactory.deploy(
            config.baseUri,
            config.contractUri,
            splitContract.address,
            config.royalties,
            config.distributorFee
        );
        
        await chaosSongs.deployed()

        const tx1 = await chaosSongs.setPackContract(packContract.address);
        await tx1.wait()
        const tx2 = await packContract.setSongContract(chaosSongs.address);
        await tx2.wait()

        const tx3 = await chaosSongs.mintSupercharged(
            accounts[0].address,
            config.supercharged
        );
        
        await tx3.wait()
        const tx4 = await chaosSongs.setSuperchargedOffset();
        
        await tx4.wait()
        
        const tx5 = await packContract.setSaleEnabled(true)
        await tx5.wait()
        
        console.log({
            packContract: packContract.address,
            splitContract: splitContract.address,
            chaosSongs: chaosSongs.address
        })


    console.log("Configured...");
};
export default func;
func.id = "nft_token_deploy";
func.tags = ["local"];
