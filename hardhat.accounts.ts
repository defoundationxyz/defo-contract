import { config as dotenvConfig } from "dotenv";
import { HardhatNetworkAccountsUserConfig } from "hardhat/src/types/config";
import { resolve } from "path";

import {
  FUJI_DAI_ADDRESS,
  FUJI_DEFO_ADDRESS,
  FUJI_JOE_ROUTER_ADDRESS,
  MAINNET_DAI_ADDRESS,
  MAINNET_DEFO_ADDRESS,
  MAINNET_SWAPSICLE_ROUTER_ADDRESS,
} from "./constants/addresses";

dotenvConfig({ path: resolve(__dirname, "./.env") });

type NamedAccounts<AccountName extends string = string, NetworkName extends string = string> = Record<
  AccountName,
  string | number | Record<NetworkName, null | number | string>
>;

const balance = "100000000000000000000000";

const mainnetAccounts = [
  process.env.MAINNET_DEPLOYER_PRIVATE_KEY ?? "",
  process.env.MAINNET_TREASURY_PRIVATE_KEY ?? "",
  process.env.MAINNET_DONATIONS_PRIVATE_KEY ?? "",
  process.env.MAINNET_STABILIZER_PRIVATE_KEY ?? "",
  process.env.MAINNET_VAULT_PRIVATE_KEY ?? "",
  process.env.MAINNET_REWARD_POOL_PRIVATE_KEY ?? "",
  process.env.MAINNET_DEFO_TOKEN_PRIVATE_KEY ?? "",
];

const accounts: HardhatNetworkAccountsUserConfig = [
  {
    privateKey: process.env.DEPLOYER_PRIVATE_KEY || "",
    balance,
  },
  {
    privateKey: process.env.TREASURY_PRIVATE_KEY || "",
    balance,
  },
  {
    privateKey: process.env.DONATIONS_PRIVATE_KEY || "",
    balance,
  },
  {
    privateKey: process.env.STABILIZER_PRIVATE_KEY || "",
    balance,
  },
  {
    privateKey: process.env.VAULT_PRIVATE_KEY || "",
    balance,
  },
  {
    privateKey: process.env.REWARD_POOL_PRIVATE_KEY || "",
    balance,
  },
  {
    privateKey: process.env.DEFO_TOKEN_PRIVATE_KEY || "",
    balance,
  },
];

// also used to index the accounts array
const namedAccountsIndex: NamedAccounts = {
  deployer: 0,
  treasury: 1,
  donations: 2,
  stabilizer: 3,
  vault: 4,
  rewardPool: 5,
  defoTokenOwner: 6,
  dai: {
    43114: MAINNET_DAI_ADDRESS,
    43113: FUJI_DAI_ADDRESS,
    1337: (process.env.FORK_ENABLED && (process.env.FORK_TESTNET ? FUJI_DAI_ADDRESS : MAINNET_DAI_ADDRESS)) ?? null,
  },
  ///todo get rid of this, should be one variable - both for deployed in deploy script and forked
  forkedDefoToken: {
    43114: MAINNET_DEFO_ADDRESS,
    43113: FUJI_DEFO_ADDRESS,
    1337:
      (process.env.FORK_DEFO_TOKEN && (process.env.FORK_TESTNET ? FUJI_DEFO_ADDRESS : MAINNET_DEFO_ADDRESS)) ?? null,
  },
  dexRouter: {
    43114: MAINNET_SWAPSICLE_ROUTER_ADDRESS,
    43113: FUJI_JOE_ROUTER_ADDRESS,
    1337:
      (process.env.FORK_ENABLED &&
        (process.env.FORK_TESTNET ? FUJI_JOE_ROUTER_ADDRESS : MAINNET_SWAPSICLE_ROUTER_ADDRESS)) ??
      null,
  },
};

if (Object.values(accounts).length < 7) {
  throw new Error("Please check you've set all six different private keys in the .env file");
}

export { NamedAccounts, accounts, mainnetAccounts, namedAccountsIndex };
