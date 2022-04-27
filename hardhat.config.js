require("@nomiclabs/hardhat-waffle");
require("hardhat-gas-reporter");
require("solidity-coverage");
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
};
