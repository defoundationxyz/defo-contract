import { Contract, providers } from "ethers";
import { HardhatRuntimeEnvironment } from "hardhat/types";

import { NamedAccounts, namedAccountsIndex } from "../hardhat.accounts";

export const isFuji = async (hre: HardhatRuntimeEnvironment) => {
  const chainId = parseInt(await hre.getChainId(), 10);
  return chainId === 43113;
};

export const isMainnet = async (hre: HardhatRuntimeEnvironment) => {
  const chainId = parseInt(await hre.getChainId(), 10);
  return chainId === 43114;
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

export const getTime = (formatter: (timestamp: number) => string) => async (provider: providers.JsonRpcProvider) =>
  formatter((await provider.getBlock("latest")).timestamp);

export const advanceBlock = async (provider: providers.JsonRpcProvider) => provider.send("evm_mine", []);

export const increaseTime = async (provider: providers.JsonRpcProvider, time: number) => {
  await provider.send("evm_increaseTime", [time]);
  await advanceBlock(provider);
};
export const setTime = async (provider: providers.JsonRpcProvider, time: number, advance: boolean = true) => {
  await provider.send("evm_setNextBlockTimestamp", [time]);
  if (advance) await advanceBlock(provider);
};
