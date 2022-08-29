import { NetworksUserConfig } from "hardhat/src/types/config";

import { accounts } from "./hardhat.accounts";


export const avalancheMainnetJsonRPCUrl: string =
  process.env.MAINNET_RPC_URL || "https://api.avax.network/ext/bc/C/rpc";
export const avalancheFujiJsonRPCUrl: string = process.env.FUJI_RPC_URL || "https://api.avax-test.network/ext/bc/C/rpc";
/// TODO add accounts to fuji?
const networks: NetworksUserConfig = {
  hardhat: {
    chainId: 1337,
    allowUnlimitedContractSize: true,
    gas: 12000000,
    blockGasLimit: 0x1fffffffffffff,
    forking: {
      enabled: !!process.env.FORK_ENABLED,
      url: process.env.FORK_TESTNET ? avalancheFujiJsonRPCUrl : avalancheMainnetJsonRPCUrl,
    },
    accounts,
  },
  localhost: {
    url: "http://127.0.0.1:8545",
  },
  fuji: {
    chainId: 43113,
    url: avalancheFujiJsonRPCUrl,
    accounts: {
      mnemonic: process.env.LIVENET_MNEMONIC,
      path: "m/44'/60'/0'/0",
      initialIndex: 0,
      count: 7,
    },
  },
};

export default networks;
