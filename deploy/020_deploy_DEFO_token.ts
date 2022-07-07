import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

import { deployAndTell } from "../utils/deployFunc";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const {
    getNamedAccounts,
    deployments: { deploy },
  } = hre;
  const { deployer } = await getNamedAccounts();

  await deployAndTell(deploy, "DEFOToken", {
    from: deployer,
    owner: deployer,
  });
};

export default func;
func.tags = ["DEFO"];
