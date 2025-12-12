require("@nomicfoundation/hardhat-toolbox");
require("@openzeppelin/hardhat-upgrades");
require("@nomicfoundation/hardhat-verify");
require("dotenv").config();

module.exports = {
  solidity: {
    compilers: [
      { version: '0.8.22' },
      { version: '0.8.20' }
    ]
  },
  networks: {
    hardhat: {},
    localhost: {
      url: "http://127.0.0.1:8545"
    }
  }
  , etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY || ""
  }
};
