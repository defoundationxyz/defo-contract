import { fundDefo } from "@utils/actions.helper";
import { announce, error, info, success } from "@utils/output.helper";
import { task, types } from "hardhat/config";

export default task("get-some-defo", "get funded with DEFO Token")
  .addOptionalParam(
    "account",
    "The account name to get defo, e.g. 'treasury', 'vault', or 'all'",
    "deployer",
    types.string,
  )
  .addOptionalParam("amount", "How much", 10000, types.int)
  .setAction(async ({ account, amount }, hre) => {
    const { getNamedAccounts } = hre;
    const namedAccounts = await getNamedAccounts();
    if (account !== "all" && !namedAccounts[account]) {
      error(`Named account ${account} not set`);
      return;
    }
    const accounts = account === "all" ? Object.values(namedAccounts) : [namedAccounts[account]];
    announce(`Funding ${accounts.toString()} with ${amount} DEFO...`);
    for (const account of accounts) {
      await fundDefo(hre, account, amount);
      info(`Funded ${account}.`);
    }
    success("Done");
  });
