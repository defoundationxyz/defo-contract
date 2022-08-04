import { getContractWithSigner } from "@utils/chain.helper";
import { HardhatRuntimeEnvironment } from "hardhat/types";

import { DEFOToken } from "../types";


export const fundDefo = async (hre: HardhatRuntimeEnvironment, account: string, amount: number) => {
  const defoContract = await getContractWithSigner<DEFOToken>(hre, "DEFOToken", "defoTokenOwner");
  const { defoTokenOwner } = await hre.getNamedAccounts();
  const amt = hre.ethers.utils.parseEther(amount.toString());
  await defoContract.mint(defoTokenOwner, amt);
  if (account !== defoTokenOwner) {
    await defoContract.transfer(account, amt);
  }
};
