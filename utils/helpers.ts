import chalk from "chalk";
import { providers } from "ethers";
import { DeployResult } from "hardhat-deploy/dist/types";

export const info = (message: string) => console.log(chalk.dim(message));
export const success = (message: string) => console.log(chalk.green(message));

export const deployInfo = (message: string) => !process.env.HIDE_DEPLOY_LOG && console.log(chalk.dim(message));
export const deployAnnounce = (message: string) => !process.env.HIDE_DEPLOY_LOG && console.log(chalk.cyan(message));
export const deployWarning = (message: string) => !process.env.HIDE_DEPLOY_LOG && console.log(chalk.yellow(message));
export const deploySuccess = (message: string) => !process.env.HIDE_DEPLOY_LOG && console.log(chalk.green(message));

export const displayDeployResult = (name: string, result: DeployResult) =>
  !result.newlyDeployed
    ? deployWarning(`Re-used existing ${name} at ${result.address}`)
    : deploySuccess(`${name} deployed at ${result.address}`);

export const increaseTime = async (provider: providers.JsonRpcProvider, time: number) => {
  await provider.send("evm_increaseTime", [time]);
  await provider.send("evm_mine", []);
};

export const chainName = (chainId: number) => {
  switch (chainId) {
    case 1337:
    case 31337:
      return "HardhatEVM";
    case 43113:
      return "Avalanche Fuji Testnet";
    case 43114:
      return "Avalanche Mainnet";
    default:
      return "Unknown";
  }
};
