import chalk from "chalk";
import { task } from "hardhat/config";

import ERC20_ABI from "../abi/defo-abi.json";
import { announce, info } from "../utils/helpers";

task(
  "accounts",
  "Get the address and balance information (AVAX, DEFO, DAI, gems) for the accounts.",
  async (_, hre) => {
    const { getNamedAccounts, deployments } = hre;
    const namedAccounts = await getNamedAccounts();
    const { dai, forkedDefoToken } = namedAccounts;
    info("\n 📡 Querying balances...");
    const daiContract = await hre.ethers.getContractAt(ERC20_ABI, dai);
    const deployedDEFOToken = (await deployments.getOrNull("DEFOToken"))?.address || "";

    const defoContract =
      forkedDefoToken || deployedDEFOToken
        ? await hre.ethers.getContractAt("DEFOToken", forkedDefoToken || deployedDEFOToken)
        : null;
    announce(
      `DEFO token is ${chalk.yellow(
        forkedDefoToken ? "forked" : deployedDEFOToken ? "deployed locally" : chalk.red("not deployed!"),
      )}. Address: ${defoContract?.address}`,
    );

    const table = await Promise.all(
      Object.entries(namedAccounts).map(async ([accountName, accountAddress]) => {
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
  },
);
