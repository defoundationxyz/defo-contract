import { fundDefo } from "@utils/actions.helper";
import { isMainnet } from "@utils/chain.helper";
import { announce, error, info, networkInfo, success } from "@utils/output.helper";
import { task, types } from "hardhat/config";

export default task("get-some-defo", "get funded with DEFO Token")
  .addOptionalParam(
    "account",
    "The account name to get defo, e.g. 'treasury', 'vault', or 'all'",
    "deployer",
    types.string,
  )
  .addOptionalParam("user", "user address to get", undefined, types.string)
  .addParam("amount", "How much", 100_000, types.int)
  .setAction(async ({ account, user, amount }, hre) => {
    const { getNamedAccounts } = hre;
    if (await isMainnet(hre)) {
      error("Not applicable to mainnet!");
      return;
    }

    const namedAccounts = await getNamedAccounts();
    await networkInfo(hre, info);
    if (user === undefined && account !== "all" && !namedAccounts[account]) {
      error(`Named account ${account} or user not set`);
      return;
    }

    const accounts = user ? [user] : account === "all" ? Object.values(namedAccounts) : [namedAccounts[account]];
    announce(`Funding ${accounts.toString()} with DEFO...`);
    for (const account of accounts) {
      await fundDefo(hre, account, amount);
      success(`${amount.toLocaleString()} DEFO has been minted to ${account}.`);
    }
  });
