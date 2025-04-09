import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@typechain/hardhat";
const config: HardhatUserConfig = {
  solidity: "0.8.28",
  networks: {
    hardhat: {}
  }
};

export default config;
