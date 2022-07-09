import chalk from "chalk";
import { task } from "hardhat/config";

import DAI_ABI from "../abi/dai-abi.json";
import { announce, info } from "../utils/helpers";

task("accounts", "Get the address and balance information (AVAX, DEFO, DAI) for the accounts.", async (_, hre) => {
  const { getNamedAccounts, deployments } = hre;
  const namedAccounts = await getNamedAccounts();
  const { dai, forkedDefoToken } = namedAccounts;
  info("\n 📡 Querying balances...");
  const daiContract = await hre.ethers.getContractAt(DAI_ABI, dai);
  const defoTokenDeployment = (await deployments.getOrNull("DEFOToken"))?.address || "";
  const diamondDeployment = await deployments.get("DEFODiamond");

  const accounts = { ...namedAccounts, DEFOdiamond: diamondDeployment.address };

  const defoContract =
    forkedDefoToken || defoTokenDeployment
      ? await hre.ethers.getContractAt("DEFOToken", forkedDefoToken || defoTokenDeployment)
      : null;
  announce(
    `DEFO token is ${chalk.yellow(
      forkedDefoToken ? "forked" : defoTokenDeployment ? "deployed locally" : chalk.red("not deployed!"),
    )}. Address: ${defoContract?.address}`,
  );

  const table = await Promise.all(
    Object.entries(accounts).map(async ([accountName, accountAddress]) => {
      return {
        name: accountName,
        address: accountAddress,
        AVAX: Number(hre.ethers.utils.formatEther(await hre.ethers.provider.getBalance(accountAddress))),
        DAI: Number(hre.ethers.utils.formatEther(await daiContract.balanceOf(accountAddress))),
        DEFO: defoContract && Number(hre.ethers.utils.formatEther(await defoContract.balanceOf(accountAddress))),
      };
    }),
  );
  console.table(table);
});
