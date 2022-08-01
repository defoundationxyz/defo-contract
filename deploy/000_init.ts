import { chainName, isTestEnvironment } from "@utils/chain.helper";
import { deployInfo } from "@utils/output.helper";
import chalk from "chalk";
import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { getNamedAccounts } = hre;
  const { deployer } = await getNamedAccounts();

  deployInfo("\n~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~");
  deployInfo("Decentralized Foundation Contracts - Deploy Script");
  deployInfo("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~\n");
  deployInfo(
    `Network:  ${await chainName(hre)} (${(await isTestEnvironment(hre)) ? chalk.yellow("local") : chalk.red("remote")})`,
  );
  deployInfo(`Deployer: ${chalk.yellow(deployer)}`);
};

export default func;
func.tags = ["Init"];
