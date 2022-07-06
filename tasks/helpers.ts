import chalk from "chalk";
import { providers } from "ethers";
import { DeployResult } from "hardhat-deploy/dist/types";

export const info = (message: string) => console.log(chalk.dim(message));
export const success = (message: string) => console.log(chalk.green(message));

export const deployInfo = (message: string) => !process.env.HIDE_DEPLOY_LOG && console.log(chalk.dim(message));
export const deployAnnounce = (message: string) => !process.env.HIDE_DEPLOY_LOG && console.log(chalk.cyan(message));
export const deployNote = (message: string) => !process.env.HIDE_DEPLOY_LOG && console.log(chalk.yellow(message));
export const deploySuccess = (message: string) => !process.env.HIDE_DEPLOY_LOG && console.log(chalk.green(message));

export const displayDeployResult = (name: string, result: DeployResult) =>
  !result.newlyDeployed
    ? deployNote(`Re-used existing ${name} at ${result.address}`)
    : deploySuccess(`${name} deployed at ${result.address}`);

export const increaseTime = async (provider: providers.JsonRpcProvider, time: number) => {
  await provider.send("evm_increaseTime", [time]);
  await provider.send("evm_mine", []);
};
