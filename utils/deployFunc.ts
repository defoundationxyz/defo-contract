import { DiamondOptions } from "hardhat-deploy/dist/types";
import { DeployOptions, DeployResult } from "hardhat-deploy/types";

import { deployAnnounce, displayDeployResult } from "./output.helper";

type DeployFunctionType = (name: string, options: DeployOptions) => Promise<DeployResult>;
type DiamondFunctionType = (name: string, options: DiamondOptions) => Promise<DeployResult>;

export const deployAndTell = async (
  deploy: DeployFunctionType | DiamondFunctionType,
  contractName: string,
  args: any,
) => {
  deployAnnounce(`\n 📡 Deploying ${contractName}...\n`);
  const contractResult = await deploy(contractName, { log: !process.env.HIDE_DEPLOY_LOG, ...args });
  displayDeployResult(contractName, contractResult);
  return contractResult;
};
