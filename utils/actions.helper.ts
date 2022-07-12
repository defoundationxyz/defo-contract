import { getContractWithSigner } from "@utils/chain.helper";
import { providers } from "ethers";
import { HardhatRuntimeEnvironment } from "hardhat/types";

import { DEFOToken } from "../types";

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

export const fundDefo = async (hre: HardhatRuntimeEnvironment, account: string, amount: number) => {
  const defoContract = await getContractWithSigner<DEFOToken>(hre, "DEFOToken", "defoTokenOwner");
  const namedAccounts = await hre.getNamedAccounts();
  const amt = hre.ethers.utils.parseEther(amount.toString());
  await defoContract.mint(namedAccounts.defoTokenOwner, amt);
  if (account !== namedAccounts.defoTokenOwner) {
    await defoContract.transfer(account, amt);
  }
};
