import { providers } from "ethers";

export const advanceBlock = async (provider: providers.JsonRpcProvider) => {
  return provider.send("evm_mine", []);
};

export const increaseTime = async (provider: providers.JsonRpcProvider, time: number) => {
  await provider.send("evm_increaseTime", [time]);
  await provider.send("evm_mine", []);
};

export const setTime = async (provider: providers.JsonRpcProvider, time: number, advance: boolean = true) => {
  await provider.send("evm_setNextBlockTimestamp", [time]);
  if (advance) await advanceBlock(provider);
};

export const chainName = (chainId: number) => {
  switch (chainId) {
    case 1337:
    case 31337:
      return "HardhatEVM";
    case 43113:
      return "Avalanche Fuji Testnet";
    case 43114:
      return "Avalanche Mainnet";
    default:
      return "Unknown";
  }
};
