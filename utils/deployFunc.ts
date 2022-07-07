import { DiamondOptions } from "hardhat-deploy/dist/types";
import { DeployOptions, DeployResult } from "hardhat-deploy/types";

import { deployAnnounce, displayDeployResult } from "./helpers";

type DeployFunctionType = (name: string, options: DeployOptions) => Promise<DeployResult>;
type DiamondFunctionType = (name: string, options: DiamondOptions) => Promise<DeployResult>;

export const deployAndTell = async (
  deploy: DeployFunctionType | DiamondFunctionType,
  contractName: string,
  args: any,
) => {
  deployAnnounce(`\n 📡 Deploying ${contractName}...\n`);
  const contractResult = await deploy(contractName, { log: true, ...args });
  displayDeployResult("Diamond", contractResult);
  return contractResult;
};
