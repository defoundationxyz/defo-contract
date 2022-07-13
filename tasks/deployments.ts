import { info } from "@utils/output.helper";
import { task } from "hardhat/config";

task("deployments", "Get all deployments made to the current Hardhat EVM", async (_, hre) => {
  const { deployments } = hre;
  Object.entries(await deployments.all()).forEach(([contract, deployment]) => {
    info(`${contract}: ${deployment.address}`)
  });
});
