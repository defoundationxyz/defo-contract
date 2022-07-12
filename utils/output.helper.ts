import chalk, { Chalk } from "chalk";
import { ethers } from "ethers";
import { DeployResult } from "hardhat-deploy/dist/types";
import _ from "lodash";
import moment from "moment";

type MutableObject<T> = { -readonly [P in keyof T]: T[P] };

const suppresableLogger =
  (hide: boolean | string | undefined, logger: (message: string) => void) => (message: string) =>
    !hide && logger(message);

const taskLogger = suppresableLogger(process.env.HIDE_TASK_LOG, console.log);
export const info = (message: string) => taskLogger(chalk.dim(message));
export const announce = (message: string) => taskLogger(chalk.cyan(message));
export const success = (message: string) => taskLogger(chalk.green(message));
export const warning = (message: string) => taskLogger(chalk.yellow(message));
export const error = (message: string) => taskLogger(chalk.red(message));

const deployLogger = suppresableLogger(process.env.HIDE_DEPLOY_LOG, console.log);
export const deployInfo = (message: string) => deployLogger(chalk.dim(message));
export const deployAnnounce = (message: string) => deployLogger(chalk.cyan(message));
export const deployWarning = (message: string) => deployLogger(chalk.yellow(message));
export const deploySuccess = (message: string) => deployLogger(chalk.green(message));

export const displayDeployResult = (name: string, result: DeployResult) =>
  !result.newlyDeployed
    ? deployWarning(`Re-used existing ${name} at ${result.address}`)
    : deploySuccess(`${name} deployed at ${result.address}`);

export const outputFormatKeyValue = (key: string, value: string | number): string | number =>
  key.match("Last|Time")
    ? moment.unix(Number(value)).format("DD.MM.YYYY HH:mm:ss")
    : key.match("Fee|Price|Reward|Maintenance") && !key.match("Rate")
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
