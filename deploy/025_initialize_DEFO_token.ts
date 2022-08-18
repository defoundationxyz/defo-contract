import { DEFOToken } from "@contractTypes/contracts/token";
import { getContractWithSigner } from "@utils/chain.helper";
import { deploySuccess } from "@utils/output.helper";
import { deployments } from "hardhat";
import { DeployFunction } from "hardhat-deploy/types";


const func: DeployFunction = async hre => {
  const defoContract = await getContractWithSigner<DEFOToken>(hre, "DEFOToken", "defoTokenOwner");
  const diamondDeployment = await deployments.get("DEFODiamond");
  await defoContract.linkDiamond(diamondDeployment.address);

  deploySuccess("DEFO Token initialized");
};

export default func;
func.tags = ["DEFOTokenInit"];