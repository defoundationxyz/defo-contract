require("@nomiclabs/hardhat-waffle");
require('dotenv').config();

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
// task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
//   const accounts = await hre.ethers.getSigners();

//   for (const account of accounts) {
//     console.log(account.address);
//   }
// });

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */

const accounts = [
  { privateKey: process.env.DEPLOYER_PRIVATE_KEY, balance: "10000000000000000000000" },
  { privateKey: process.env.TREASURY_WALLET_PRIVATE_KEY, balance: "20000000000000000000000" },
  { privateKey: process.env.DONATIONS_WALLET_PRIVATE_KEY, balance: "0" },
  { privateKey: process.env.TEAM_WALLET_PRIVATE_KEY, balance: "20000000000000000000000" },
  { privateKey: process.env.VAULT_PRIVATE_KEY, balance: "0" },
  { privateKey: process.env.REWARD_POOL_PRIVATE_KEY, balance: "10000000000000000000000" },
];

module.exports = {
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {
      chainId: 1337,
      gasPrice: 225000000000,
      accounts,
      forking: {
        // url: "https://rinkeby.infura.io/v3/62f40acd5ec24ddd9405609cdc2dc76f",
        // url: `https://rinkeby.infura.io/v3/${process.env.INFURA_ID}`,
        url: "https://api.avax-test.network/ext/bc/C/rpc",
        // enabled: true,
        // saveDeployments: true,
        // blockNumber: 1057997,
      },
    },
    fuji: {
      chainId: 43113,
      url: "https://api.avax-test.network/ext/bc/C/rpc",
      accounts: [
        process.env.DEPLOYER_PRIVATE_KEY,
        process.env.TEAM_WALLET_PRIVATE_KEY
      ]
    },
    avalancheTest: {
      url: 'https://api.avax-test.network/ext/bc/C/rpc',
      gasPrice: 225000000000,
      chainId: 43113,
      accounts: [
        process.env.DEPLOYER_PRIVATE_KEY,
        process.env.TEAM_WALLET_PRIVATE_KEY
      ]
    },
    rinkeby: {
      url: `https://rinkeby.infura.io/v3/${process.env.INFURA_ID}`,
      accounts: [
        process.env.DEPLOYER_PRIVATE_KEY,
        process.env.TEAM_WALLET_PRIVATE_KEY
      ],
      saveDeployments: true,
      tags: ["rinkeby-test-network"]
    }
  },
  solidity: {
    compilers: [
      {
        version: "0.5.0",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200
          }
        },
      },
      {
        version: "0.6.12",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200
          }
        },
      },
      {
        version: "0.8.4",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200
          }
        },
      },
    ],
  },
};
