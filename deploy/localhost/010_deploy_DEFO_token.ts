import { DeployFunction } from "hardhat-deploy/types";

import { deployAndTell } from "../../utils/deployFunc";

const func: DeployFunction = async hre => {
  const {
    getNamedAccounts,
    deployments: { deploy },
    getChainId,
  } = hre;
  const { deployer } = await getNamedAccounts();
  const chainId = await getChainId();

  await deployAndTell(deploy, "DEFOToken", {
    from: deployer,
    owner: deployer,
    args: [chainId],
  });
  /// TODO clarify and deploy under DEFO token deployer / transfer ownership
  /// TODO set total supply and other parameters from tokenomics requirements
};

export default func;
func.tags = ["DEFOToken"];
