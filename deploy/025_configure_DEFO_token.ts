import { DEFOToken } from "@contractTypes/contracts/token";
import { getContractWithSigner } from "@utils/chain.helper";
import { deployInfo, deploySuccess } from "@utils/output.helper";
import { deployments } from "hardhat";
import { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async hre => {
  const { deployer, stabilizer, treasury, vault, rewardPool } = await hre.getNamedAccounts();
  const defoContract = await getContractWithSigner<DEFOToken>(hre, "DEFOToken", "defoTokenOwner");
  const diamondDeployment = await deployments.get("DEFODiamond");
  await (await defoContract.linkDiamond(diamondDeployment.address)).wait();

  for (const privilegedAddress of [deployer, diamondDeployment.address, stabilizer, treasury, vault, rewardPool]) {
    if (await defoContract.authorized(privilegedAddress))
      deployInfo(`${privilegedAddress}, already authorized, skipping`);
    else {
      deployInfo(`authorizing ${privilegedAddress}`);
      await (await defoContract.rely(privilegedAddress)).wait();
    }
  }
  deploySuccess("DEFO Token initialized");
};

export default func;
func.tags = ["DEFOTokenInit"];
