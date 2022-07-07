import { task, types } from "hardhat/config";

import { DEFOToken } from "../types";
import { error, info } from "../utils/helpers";

export default task("get-some-defo", "get funded with DEFO Token")
  .addOptionalParam(
    "account",
    "The account name to get defo, e.g. 'treasury', 'vault', or 'all'",
    "deployer",
    types.string,
  )
  .addOptionalParam("amount", "How much", 10000, types.int)
  .setAction(async ({ account, amount }, hre) => {
    const { getNamedAccounts, deployments, ethers } = hre;
    const namedAccounts = await getNamedAccounts();
    if (account !== "all" && !namedAccounts[account]) {
      error(`Named account ${account} not set`);
      return;
    }
    const defoTokenDeployment = await deployments.get("DEFOToken");
    const defoContract = await ethers.getContractAt<DEFOToken>("DEFOToken", defoTokenDeployment.address);

    const accounts = account === "all" ? Object.values(namedAccounts) : [namedAccounts[account]];
    for (const account of accounts) {
      info(`Funding...${account}`);
      const amt = ethers.utils.parseEther(amount.toString());
      await defoContract.mint(namedAccounts.deployer, amt);
      if (account !== namedAccounts.deployer) {
        await defoContract.transfer(account, amt);
      }
    }
  });
