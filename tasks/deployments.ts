import { task } from "hardhat/config";

import { info } from "../utils/helpers";

task("deployments", "Get all deployments made to the current Hardhat EVM", async (_, hre) => {
  const { deployments } = hre;
  Object.values(await deployments.all()).forEach(deployment => {
    info(deployment.address);
  });
});
