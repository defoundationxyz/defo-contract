import { info, networkInfo } from "@utils/output.helper";
import chalk from "chalk";
import { task } from "hardhat/config";


task("deployments", "Get all deployments made to the current Hardhat EVM", async (_, hre) => {
  const { deployments } = hre;
  await networkInfo(hre, info);
  Object.entries(await deployments.all()).forEach(([contract, deployment]) => {
    info(`${contract.padEnd(30)}: ${chalk.green(deployment.address)}`);
  });
});
