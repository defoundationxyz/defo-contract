require("@nomiclabs/hardhat-waffle");
<<<<<<< HEAD
require("hardhat-gas-reporter");
require("solidity-coverage");
=======
require('dotenv').config();

>>>>>>> feature/lpManager
// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
<<<<<<< HEAD
<<<<<<< HEAD
    solidity: {
    version: "0.8.7",
    settings: {
      optimizer: {
        enabled: true,
        runs: 1
      }
    }
  },
  networks: {
    ganache: {
      url: "HTTP://127.0.0.1:7545",
      accounts: ["88ea8fa1a68d36da48826e517a098fb95e013c4c0960a9017e618cbc6ef22ccd"]
    },
    rinkeby: {
      url: "https://rinkeby.infura.io/v3/459646cc0c034ae097198e21693de9e5",
      accounts: [process.env.RINKEBY]
    }
  }
=======
=======
>>>>>>> feature/lpManager
  networks:{
    hardhat: {
      chainId: 43114,
      gasPrice: 225000000000,
      forking: {
          url: "https://api.avax.network/ext/bc/C/rpc",
          enabled: true,
<<<<<<< HEAD
          blockNumber: 8528605,
=======
          blockNumber: 8772544,
>>>>>>> feature/lpManager
      },
    },
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
<<<<<<< HEAD
>>>>>>> feature/limiter
=======
>>>>>>> feature/lpManager
};
