import { getContractWithSigner } from "@utils/chain.helper";
import { HardhatRuntimeEnvironment } from "hardhat/types";

import { DEFOToken } from "../types";

export const fundDefo = async (hre: HardhatRuntimeEnvironment, account: string, amount: number) => {
  const defoContract = await getContractWithSigner<DEFOToken>(hre, "DEFOToken", "deployer");
  const namedAccounts = await hre.getNamedAccounts();
  const amt = hre.ethers.utils.parseEther(amount.toString());
  await defoContract.mint(namedAccounts.deployer, amt);
  if (account !== namedAccounts.deployer) {
    await defoContract.transfer(account, amt);
  }
};
