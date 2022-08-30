import { fromWei, toWei } from "@config";
import { announce, info, networkInfo, success } from "@utils/output.helper";
import assert from "assert";
import chalk from "chalk";
import { task, types } from "hardhat/config";

import { RewardsFacet, VaultFacet } from "../types";


task("vault", "Get the vault state")
  .addParam("op", "operation: 'view', 'stake' or 'unstake'", "view", types.string)
  .addOptionalParam("id", "gem id to stake or unstake", undefined, types.int)
  .addOptionalParam(
    "amount",
    "amount of pending unclaimed rewards to stake or the amount currently in the vault to unstake",
    undefined,
    types.float,
  )
  .setAction(async ({ id, op, amount }, hre) => {
    const { ethers } = hre;
    await networkInfo(hre, info);
    const vaultStakingFacet = await ethers.getContract<RewardsFacet & VaultFacet>("DEFODiamond_DiamondProxy");

    const vaultInfo = async () => {
      info(
        `Rewards staked by all users ${chalk.yellow("getStakedGrossAllUsers()")}: ${fromWei(
          await vaultStakingFacet.getStakedGrossAllUsers(),
        )}`,
      );
      info(
        `Rewards staked by deployer  ${chalk.yellow("getStakedGross()")}: ${fromWei(
          await vaultStakingFacet.getStakedGross(),
        )}`,
      );
      info(
        `Final deployer's amount in the vault ${chalk.yellow("getTotalStaked()")}:  ${fromWei(
          await vaultStakingFacet.getTotalStaked(),
        )}`,
      );
      const { tokenIds_, amounts_ } = await vaultStakingFacet.getStakedAllGems();
      for (let i = 0; i < tokenIds_.length; i++) {
        if (!amounts_[i].isZero()) info(`gem id ${tokenIds_[i]}, staked ${fromWei(amounts_[i])}`);
      }
    };

    announce("Current vault stats");
    await vaultInfo();

    if (op === "stake" || !op) {
      announce("Staking to vault...");
      assert(id !== undefined && amount !== undefined, "both id and amount should be provided for staking");
      await vaultStakingFacet.stakeReward(id, toWei(amount));
      await vaultInfo();
      success("Done");
    }

    if (op === "unstake") {
      announce("Unstaking from vault...");
      assert(id !== undefined && amount !== undefined, "both id and amount should be provided for unstaking");
      await vaultStakingFacet.unStakeReward(id, toWei(amount));
      await vaultInfo();
      success("Done");
    }
  });
