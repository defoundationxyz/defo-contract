import { DEFOToken } from "@contractTypes/contracts/token";
import { getContractWithSigner } from "@utils/chain.helper";
import { deployInfo, deploySuccess } from "@utils/output.helper";
import { deployments } from "hardhat";
import { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async hre => {
  const { team, treasury, donations, vault, rewardPool } = await hre.getNamedAccounts();
  const defoContract = await getContractWithSigner<DEFOToken>(hre, "DEFOToken", "defoTokenOwner");
  const diamondDeployment = await deployments.get("DEFODiamond");
  await defoContract.linkDiamond(diamondDeployment.address);
  for (const privilegedAddress of [diamondDeployment.address, team, treasury, donations, team, vault, rewardPool]) {
    deployInfo(`Authorizing ${privilegedAddress}`);
    await defoContract.rely(privilegedAddress);
  }
  deploySuccess("DEFO Token initialized");
};

export default func;
func.tags = ["DEFOTokenInit"];
