import { strict as assert } from "assert";
import { HardhatNetworkAccountsUserConfig } from "hardhat/src/types/config";

type NamedAccounts = {
  [name: string]: string | number | { [network: string]: null | number | string };
};

const accounts: HardhatNetworkAccountsUserConfig = [
  {
    privateKey: process.env.DEPLOYER_PRIVATE_KEY || "",
    balance: "10000000000000000000000",
  },
  {
    privateKey: process.env.TREASURY_WALLET_PRIVATE_KEY || "",
    balance: "20000000000000000000000",
  },
  {
    privateKey: process.env.DONATIONS_WALLET_PRIVATE_KEY || "",
    balance: "10000000000000000000000",
  },
  {
    privateKey: process.env.TEAM_WALLET_PRIVATE_KEY || "",
    balance: "20000000000000000000000",
  },
  {
    privateKey: process.env.VAULT_PRIVATE_KEY || "",
    balance: "10000000000000000000000",
  },
  {
    privateKey: process.env.REWARD_POOL_PRIVATE_KEY || "",
    balance: "10000000000000000000000",
  },
];

const namedAccounts: NamedAccounts = {
  deployer: 0,
  treasury: 1,
  donations: 2,
  team: 3,
  vault: 4,
  reward: 5,
};

// Check if there are fewer accounts set in .env than needed or the same privateKey for different contracts
assert.ok(Object.values(accounts).length === Object.values(namedAccounts).length);

export { accounts, namedAccounts };
