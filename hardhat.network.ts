import { NetworksUserConfig } from "hardhat/src/types/config";
import { accounts } from './hardhat.accounts';
import urlExist from 'url-exist';

const exitingUrl = async (url: string): Promise<string | never>  => {
  if (await urlExist(url)) {
    return url
  }
  throw new Error(`RPC URL ${url} has been set in .env but it's wrong. Fix it or leave empty for the default node.`);
}

const avalancheMainnetJsonRPCUrl: string = process.env.MAINNET_RPC_URL ? await exitingUrl(process.env.MAINNET_RPC_URL) : "https://api.avax.network/ext/bc/C/rpc";
const avalancheFujiJsonRPCUrl: string = process.env.FUJI_RPC_URL ? await exitingUrl(process.env.FUJI_RPC_URL) : "https://api.avax-test.network/ext/bc/C/rpc";

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
    url: "https://api.avax-test.network/ext/bc/C/rpc",
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
      url: process.env.FORK_TESTNET ? avalancheFujiJsonRPCUrl: avalancheMainnetJsonRPCUrl,
    },
    accounts
  };
} else {
  networks.hardhat = {
    allowUnlimitedContractSize: true,
    gas: 12000000,
    blockGasLimit: 0x1fffffffffffff,
    accounts
  };
}


export default networks;
