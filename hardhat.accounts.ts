import { HardhatNetworkAccountsUserConfig } from "hardhat/src/types/config";

type NamedAccounts<AccountName extends string = string, NetworkName extends string = string> = Record<
  AccountName,
  string | number | Record<NetworkName, null | number | string>
>;

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

if (Object.values(accounts).length !== Object.values(namedAccounts).length) {
  throw new Error("Please check you've set all six different private keys in the .env file");
}

export { NamedAccounts, accounts, namedAccounts };
