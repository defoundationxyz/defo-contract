import { Contract } from "ethers";
import { HardhatRuntimeEnvironment } from "hardhat/types";

import { NamedAccounts, namedAccountsIndex } from "../hardhat.accounts";

export const isTestEnvironment = async (hre: HardhatRuntimeEnvironment) => {
  const chainId = parseInt(await hre.getChainId(), 10);
  return chainId === 31337 || chainId === 1337;
};

export const chainName = async (hre: HardhatRuntimeEnvironment) => {
  switch (parseInt(await hre.getChainId(), 10)) {
    case 1337:
    case 31337:
      return "Hardhat EVM";
    case 43113:
      return "Avalanche Fuji Testnet";
    case 43114:
      return "Avalanche Mainnet";
    default:
      return "Unknown";
  }
};

export const namedSigner = async (hre: HardhatRuntimeEnvironment, namedAccountId: keyof NamedAccounts) =>
  (await hre.ethers.getSigners())[namedAccountsIndex[namedAccountId] as unknown as number];

export const getContractWithSigner = async <T extends Contract>(
  hre: HardhatRuntimeEnvironment,
  contractName: string,
  namedAccountId?: keyof NamedAccounts,
): Promise<T> => hre.ethers.getContract<T>(contractName, await namedSigner(hre, namedAccountId ?? "deployer"));