import { deployInfo, deploySuccess } from "@utils/output.helper";
import { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async () => {
  deployInfo("\n\n~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~");
  deploySuccess("Contract Deployments Complete!");
  deployInfo("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~\n");
};

export default func;
func.runAtTheEnd = true;
