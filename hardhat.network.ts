import { NetworksUserConfig } from "hardhat/src/types/config";

import { accounts } from "./hardhat.accounts";

export const avalancheMainnetJsonRPCUrl: string =
  process.env.MAINNET_RPC_URL ?? "https://api.avax.network/ext/bc/C/rpc";
export const avalancheFujiJsonRPCUrl: string = process.env.FUJI_RPC_URL ?? "https://api.avax-test.network/ext/bc/C/rpc";

const networks: NetworksUserConfig = {
  coverage: {
    url: "http://127.0.0.1:8555",
    blockGasLimit: 200000000,
    allowUnlimitedContractSize: true,
  },
  localhost: {
    chainId: 1337,
    url: "http://127.0.0.1:8545",
    allowUnlimitedContractSize: true,
  },
  fuji: {
    chainId: 43113,
    url: avalancheFujiJsonRPCUrl,
    accounts,
  },
};

if (process.env.FORK_ENABLED) {
  networks.hardhat = {
    chainId: 1337,
    allowUnlimitedContractSize: true,
    gas: 12000000,
    blockGasLimit: 0x1fffffffffffff,
    forking: {
      url: process.env.FORK_TESTNET ? avalancheFujiJsonRPCUrl : avalancheMainnetJsonRPCUrl,
    },
    accounts,
  };
} else {
  networks.hardhat = {
    allowUnlimitedContractSize: true,
    gas: 12000000,
    blockGasLimit: 0x1fffffffffffff,
    accounts,
  };
}

export default networks;
