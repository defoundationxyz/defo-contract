import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

import { deploySuccess } from "../utils/helpers";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { read } = deployments;
  const { deployer } = await getNamedAccounts();

  const defoToken = await deployments.get("DEFOToken");
  deploySuccess(`DEFOToken verified at ${defoToken.address} : ${await read("DEFOToken", "balanceOf", deployer)}`);
};

export default func;
func.runAtTheEnd = true;
