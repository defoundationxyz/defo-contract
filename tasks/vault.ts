import { announce, info, success } from "@utils/output.helper";
import { task, types } from "hardhat/config";

import { VaultStakingFacet } from "../types";

task("vault", "Get the vault state")
  .addOptionalParam("id", "gem id to add to the vault", undefined, types.int)
  .addOptionalParam(
    "amount",
    "amount of pending unclaimed (tapered) rewards to add to the vault",
    undefined,
    types.float,
  )
  .setAction(async ({ id, amount }, hre) => {
    const { ethers } = hre;
    const vaultStakingFacet = await ethers.getContract<VaultStakingFacet>("DEFODiamond_DiamondProxy");

    announce("Showing vault stats");
    info(`Total staked ${ethers.utils.formatEther(await vaultStakingFacet.showTotalAmount())}`);
    info(`Deployer staked ${ethers.utils.formatEther(await vaultStakingFacet.showStakedAmount())}`);

    if (id || amount) {
      announce("Adding to vault");
      await vaultStakingFacet.addToVault(id ?? 0, amount ? ethers.utils.parseEther(amount.toString()) : 0);
      info(`Total staked ${ethers.utils.formatEther(await vaultStakingFacet.showTotalAmount())}`);
      info(`Deployer staked ${ethers.utils.formatEther(await vaultStakingFacet.showStakedAmount())}`);
      success("Done");
    }
  });
