import { deployAnnounce, deployInfo, deploySuccess } from "@utils/output.helper";
import { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async hre => {
  const diamondDeployment = await hre.deployments.get("DEFODiamond");
  deployInfo("\n\n~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~");
  deploySuccess("Contract Deployments Complete!");
  deployInfo("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~\n");
  deployAnnounce(`DEFO Diamond address is ${diamondDeployment.address}\n\n\n`);
};

export default func;
func.runAtTheEnd = true;
