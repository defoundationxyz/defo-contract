import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

import { deployInfo, deploySuccess } from "../../utils/helpers";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  deployInfo("\n\n~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~");
  deploySuccess("Contract Deployments Complete!");
  deployInfo("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~\n");
};

export default func;
func.runAtTheEnd = true;
