import { announce, error, success } from "@utils/output.helper";
import { task, types } from "hardhat/config";

import { beTheWhale } from "./beTheWhale";


export default task("dev:get-some-dai", "Distribute DAI from AAVE")
  .addOptionalParam(
    "account",
    "The account name to get DAI, e.g. 'treasury', 'vault', or 'all'",
    "deployer",
    types.string,
  )
  .addOptionalParam("amount", "The amount to transfer to the deployer", 100000, types.int)
  .setAction(async ({ account, amount }, hre) => {
    const { getNamedAccounts } = hre;
    if ((await hre.getChainId()) === "43114") {
      error("Not applicable to mainnet!");
      return;
    }

    const namedAccounts = await getNamedAccounts();
    if (account !== "all" && !namedAccounts[account]) {
      error(`Named account ${account} not set`);
      return;
    }
    const accounts = account === "all" ? Object.values(namedAccounts) : [namedAccounts[account]];

    for (const account of accounts) {
      announce(`Funding ${account} with DAI...`);
      await beTheWhale(hre, account, amount);
      success(`${amount.toLocaleString()} DAI has been sent to ${account}`);
    }
  });
