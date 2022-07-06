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

/// TODO revise these addresses once contracts with EIP-2612 permit are updated & deployed. Addresses will be different for fuji (DEFO, probably DAI) and for mainnet (DEFO)
const namedAccounts: NamedAccounts = {
  deployer: 0,
  treasury: 1,
  donations: 2,
  team: 3,
  vault: 4,
  reward: 5,
  dai: {
    43114: "0xd586e7f844cea2f87f50152665bcbc2c279d8d70",
    43113: "0x85a2ff500E0eD9fA93719071EA46A86198181581",
    1337:
      (process.env.FORK_ENABLED &&
        (process.env.FORK_TESTNET
          ? "0x85a2ff500E0eD9fA93719071EA46A86198181581"
          : "0xd586e7f844cea2f87f50152665bcbc2c279d8d70")) ??
      null,
  },
  defoToken: {
    43114: "0x8d352F4c8643DB1d7f7FD6F2b508998EA6cb4388",
    43113: "0x5C7ea2D484464a6Be1c2028CE1E9e1Ec339Dd3Ae",
    1337:
      (process.env.FORK_ENABLED &&
        (process.env.FORK_TESTNET
          ? "0x5C7ea2D484464a6Be1c2028CE1E9e1Ec339Dd3Ae"
          : "0x8d352F4c8643DB1d7f7FD6F2b508998EA6cb4388")) ??
      null,
  },
  joeRouter: {
    43114: "0x60aE616a2155Ee3d9A68541Ba4544862310933d4",
    43113: "0xd7f655E3376cE2D7A2b08fF01Eb3B1023191A901",
    1337:
      (process.env.FORK_ENABLED &&
        (process.env.FORK_TESTNET
          ? "0xd7f655E3376cE2D7A2b08fF01Eb3B1023191A901"
          : "0x60aE616a2155Ee3d9A68541Ba4544862310933d4")) ??
      null,
  },
};

if (Object.values(accounts).length !== Object.values(namedAccounts).length) {
  throw new Error("Please check you've set all six different private keys in the .env file");
}

export { NamedAccounts, accounts, namedAccounts };
