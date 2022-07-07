import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

import { deployInfo } from "../utils/helpers";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments } = hre;
  await deployments.get("DEFOToken");
  deployInfo("Verified");
};

export default func;
func.runAtTheEnd = true;
