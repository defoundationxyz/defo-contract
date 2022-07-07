import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

import { chainName, deployInfo } from "../utils/helpers";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { getNamedAccounts, getChainId } = hre;
  const { deployer } = await getNamedAccounts();

  const chainId = parseInt(await getChainId(), 10);
  const isTestEnvironment = chainId === 31337 || chainId === 1337;

  deployInfo("\n~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~");
  deployInfo("Decentralized Foundation Contracts - Deploy Script");
  deployInfo("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~\n");
  deployInfo(`Network: ${chainName(chainId)} (${isTestEnvironment ? "local" : "remote"})`);
  deployInfo(`Deployer: ${deployer}`);
};

export default func;
func.tags = ["Init"];
