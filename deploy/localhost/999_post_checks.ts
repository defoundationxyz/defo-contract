import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

import { deployInfo, deploySuccess } from "../../utils/output.helper";

const func: DeployFunction = async function () {
  deployInfo("\n\n~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~");
  deploySuccess("Contract Deployments Complete!");
  deployInfo("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~\n");
};

export default func;
func.runAtTheEnd = true;
