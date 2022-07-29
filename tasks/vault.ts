import { announce, info, success } from "@utils/output.helper";
import { task, types } from "hardhat/config";

import { RewardsFacet, VaultFacet } from "../types";

task("vault", "Get the vault state")
  .addOptionalParam("id", "gem id to add to the vault", undefined, types.int)
  .addOptionalParam(
    "amount",
    "amount of pending unclaimed (tapered) rewards to add to the vault",
    undefined,
    types.float,
  )
  .setAction(async ({ id, amount }, hre) => {
    const {
      ethers,
      ethers: {
        utils: { formatEther: fromWei, parseEther: toWei },
      },
    } = hre;
    const vaultStakingFacet = await ethers.getContract<RewardsFacet & VaultFacet>("DEFODiamond_DiamondProxy");

    announce("Current vault stats");
    info(`Total staked ${fromWei(await vaultStakingFacet.getStakedGrossAllUsers())}`);
    info(`Deployer staked ${fromWei(await vaultStakingFacet.getStakedGross())}`);

    if (id || amount) {
      announce("Staking to vault...");
      await vaultStakingFacet.stakeReward(id ?? 0, amount ? toWei(amount.toString()) : 0);
      info(`Total staked ${fromWei(await vaultStakingFacet.getStakedGrossAllUsers())}`);
      info(`Deployer staked ${fromWei(await vaultStakingFacet.getStakedGross())}`);
      success("Done");
    }
  });
