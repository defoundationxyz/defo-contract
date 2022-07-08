import chalk from "chalk";
import { ethers, providers } from "ethers";
import { DeployResult } from "hardhat-deploy/dist/types";
import _ from "lodash";
import moment from "moment";

type MutableObject<T> = { -readonly [P in keyof T]: T[P] };

export const info = (message: string) => console.log(chalk.dim(message));
export const announce = (message: string) => console.log(chalk.cyan(message));
export const success = (message: string) => console.log(chalk.green(message));
export const warning = (message: string) => console.log(chalk.yellow(message));
export const error = (message: string) => console.log(chalk.red(message));

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

export const outputFormatKeyValue = (key: string, value: string | number): string | number =>
  key.match("Last|Time")
    ? moment.unix(Number(value)).format("DD.MM.YYYY HH:mm:ss")
    : key.match("Fee|Price|claim")
    ? Number(ethers.utils.formatEther(value))
    : value;

export const outputFormatter = <T extends Record<string, any>>(keys: string[], object: T) =>
  Object.entries(_.pick(object, keys)).reduce<MutableObject<T>>((acc, cur) => {
    const key = cur[0];
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    acc[key] = outputFormatKeyValue(key, cur[1]);
    return acc;
  }, {} as T);
