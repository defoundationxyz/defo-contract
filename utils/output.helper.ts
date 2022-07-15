import { getTime } from "@utils/chain.helper";
import chalk from "chalk";
import { BigNumber, BigNumberish, ethers } from "ethers";
import { DeployResult } from "hardhat-deploy/dist/types";
import _ from "lodash";
import moment from "moment";

type MutableObject<T> = { -readonly [P in keyof T]: T[P] };

const suppresableLogger = (hide: boolean | string | undefined, logger: (message: any) => void) => (message: any) =>
  !hide && logger(message);

const taskLogger = suppresableLogger(process.env.HIDE_TASK_LOG, console.log);
export const info = (message: string) => taskLogger(chalk.dim(message));
export const announce = (message: string) => taskLogger(chalk.cyan(message));
export const table = (message: any) => suppresableLogger(process.env.HIDE_TASK_LOG, console.table)(message);
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

export const outputFormatKeyValue = (
  key: string,
  value: string | boolean | BigNumberish | Promise<BigNumberish> | undefined,
): string | number | bigint =>
  key.match(/Period|duration/i)
    ? moment.duration(Number(value), "s").humanize()
    : key.match(/Last|Next|Time/i)
    ? moment.unix(Number(value)).format("DD.MM.YYYY")
    : BigNumber.isBigNumber(value)
    ? Number(Number(ethers.utils.formatEther(value)).toFixed(7))
    : value instanceof Promise
    ? outputFormatKeyValue(key, Promise.resolve(value))
    : typeof value === "number"
    ? value
    : typeof value === "undefined"
    ? "-"
    : value.toString();

export const outputFormatter = <T extends Record<string, any>>(object: T, keys?: string[]) =>
  Object.entries(_.pick(object, keys || Object.keys(object).filter(i => isNaN(Number(i))))).reduce<MutableObject<T>>(
    (acc, cur) => {
      const key = cur[0];
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      acc[key] = outputFormatKeyValue(key, cur[1]);
      return acc;
    },
    {} as T,
  );

export const isKey = <T>(x: T, k: PropertyKey): k is keyof T => k in x;

export const getChainTime = getTime(timestamp => moment.unix(Number(timestamp)).format("DD.MM.YYYY HH:MM"));
