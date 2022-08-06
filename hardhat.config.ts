import "@nomiclabs/hardhat-ethers";
import "@nomiclabs/hardhat-etherscan";
import "@nomiclabs/hardhat-waffle";
import "@typechain/hardhat";
import { config as dotenvConfig } from "dotenv";
import "hardhat-abi-exporter";
import "hardhat-contract-sizer";
import "hardhat-deploy";
import "hardhat-erc1820";
import "hardhat-gas-reporter";
import "hardhat-log-remover";
import { HardhatUserConfig } from "hardhat/config";
import { resolve } from "path";
import "solidity-coverage";
import "solidity-docgen";
import "tsconfig-paths/register";

import { namedAccountsIndex } from "./hardhat.accounts";
import networks from "./hardhat.networks";
import * as tasks from "./tasks";

dotenvConfig({ path: resolve(__dirname, "./.env") });
// const snowtraceApiKey: string | undefined = process.env.SNOWTRACE_API_KEY;
// if (!snowtraceApiKey) {
//   console.log("SNOWTRACE_API_KEY not set in an .env file, won't be available");
// }

const optimizerEnabled = !process.env.OPTIMIZER_DISABLED;

const config: HardhatUserConfig = {
  defaultNetwork: "hardhat",
  abiExporter: {
    path: "./abis",
    clear: true,
    flat: true,
  },
  etherscan: {
    apiKey: process.env.SNOWTRACE_API_KEY,
  },
  gasReporter: {
    currency: "USD",
    gasPrice: 100,
    enabled: !!process.env.REPORT_GAS,
  },
  mocha: {
    timeout: 30000,
  },
  networks,
  namedAccounts: namedAccountsIndex,
  solidity: {
    compilers: [
      {
        version: "0.8.15",
        settings: {
          optimizer: {
            enabled: optimizerEnabled,
            runs: 250,
          },
          outputSelection: {
            "*": {
              "*": ["storageLayout"],
            },
          },
          evmVersion: "berlin",
        },
      },
    ],
  },
  typechain: {
    outDir: "types",
    target: "ethers-v5",
  },
  contractSizer: {
    alphaSort: true,
    disambiguatePaths: false,
    runOnCompile: true,
    strict: false,
  },
};

tasks;

export default config;
