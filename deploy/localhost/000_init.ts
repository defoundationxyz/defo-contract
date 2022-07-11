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
    `Network:  ${await chainName(hre)} (${chalk.yellow((await isTestEnvironment(hre)) ? "local" : "remote")})`,
  );
  deployInfo(`Deployer: ${chalk.yellow(deployer)}`);
};

export default func;
func.tags = ["Init"];
