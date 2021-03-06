import { announce, info } from "@utils/output.helper";
import chalk from "chalk";
import { task } from "hardhat/config";

import DAI_ABI from "../abi/dai-abi.json";

task("accounts", "Get the address and balance information (AVAX, DEFO, DAI) for the accounts.", async (_, hre) => {
  const {
    getNamedAccounts,
    deployments,
    ethers,
    ethers: {
      utils: { formatEther: fromWei },
    },
  } = hre;
  const namedAccounts = await getNamedAccounts();
  const { dai, forkedDefoToken } = namedAccounts;
  info("\n 📡 Querying balances...");
  const daiContract = await ethers.getContractAt(DAI_ABI, dai);
  const defoTokenDeployment = (await deployments.getOrNull("DEFOToken"))?.address || "";
  const diamondDeployment = await deployments.get("DEFODiamond");

  const accounts = { ...namedAccounts, DEFOdiamond: diamondDeployment.address };

  const defoContract =
    forkedDefoToken || defoTokenDeployment
      ? await ethers.getContractAt("DEFOToken", forkedDefoToken || defoTokenDeployment)
      : null;
  announce(
    `DEFO token was ${chalk.yellow(
      forkedDefoToken ? "forked" : defoTokenDeployment ? "deployed locally" : chalk.red("not deployed!"),
    )}. Address: ${defoContract?.address}`,
  );

  const table = await Promise.all(
    Object.entries(accounts).map(async ([accountName, accountAddress]) => {
      return {
        name: accountName,
        address: accountAddress,
        AVAX: Number(Number(fromWei(await ethers.provider.getBalance(accountAddress))).toFixed(3)),
        DAI: Number(Number(fromWei(await daiContract.balanceOf(accountAddress))).toFixed(3)),
        DEFO: defoContract && Number(Number(fromWei(await defoContract.balanceOf(accountAddress))).toFixed(3)),
      };
    }),
  );
  console.table(table);
});
