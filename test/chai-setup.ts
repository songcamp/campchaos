import chaiModule from "chai";
import { solidity } from 'ethereum-waffle'
import { chaiEthers } from "chai-ethers";
chaiModule.use(chaiEthers);
chaiModule.use(solidity);
export = chaiModule;
