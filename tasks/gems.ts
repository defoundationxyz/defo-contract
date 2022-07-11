import { GEMS, MIN_REWARD_TIME, gemName } from "@config";
import { announce, info, outputFormatKeyValue, outputFormatter, warning } from "@utils/output.helper";
import { task, types } from "hardhat/config";
import _ from "lodash";

import { ERC721Facet, GemFacet, GemGettersFacet } from "../types";
import { LibGem } from "../types/contracts/facets/GemGettersFacet";

export default task("gems", "get gems info and balance information for the deployer")
  .addOptionalParam("type", "0 - sapphire, 1 - ruby, 2 - diamond, empty (-1) - get info for all three", -1, types.int)
  .setAction(async ({ type }, hre) => {
    const { getNamedAccounts, deployments, ethers } = hre;
    const { deployer } = await getNamedAccounts();
    info("\n 📡 Querying gems...");

    const diamondDeployment = await deployments.get("DEFODiamond");
    const gemFacetContract = await ethers.getContractAt<GemFacet>("GemFacet", diamondDeployment.address);
    const gemGettersFacet = await ethers.getContractAt<GemGettersFacet>("GemGettersFacet", diamondDeployment.address);
    const gemNFT = await ethers.getContractAt<ERC721Facet>("ERC721Facet", diamondDeployment.address);
    const types: number[] = type === -1 ? Object.values(GEMS) : [type];

    const gemIds = await gemFacetContract.getGemIdsOf(deployer);
    const gemsIdsWithData = await Promise.all(
      gemIds.map(async gemId => {
        const gemData = await gemGettersFacet.GemOf(gemId);
        return {
          gemId: Number(gemId),
          ...gemData,
          unclaimedReward: await gemFacetContract.checkTaperedReward(gemId),
          pendingMaintenance: await gemFacetContract.checkPendingMaintenance(gemId),
          claimable: await gemFacetContract.isClaimable(gemId),
        };
      }),
    );
    // const checkRewardTx0 = ethers.utils.formatEther(await gemFacetInstance.checkRawReward(0));
    // console.log(`reward after ${DAYS_AFTER} days for gem id 0: `, checkRewardTx0);

    const gemsGroupedByType = gemsIdsWithData.reduce(
      (r, v, i, a, k = v.GemType) => ((r[k] || (r[k] = [])).push(v), r),
      {} as Array<Array<LibGem.GemStructOutput & { gemId: number; claimable: boolean }>>,
    );
    announce(`Deployer ${deployer} has ${await gemNFT.balanceOf(deployer)} gem(s)`);
    info(`Total Charity: ${await gemGettersFacet.getTotalCharity()}`);

    for (const gemType of types) {
      warning(`\n\nGem ${gemName(gemType)} (type ${gemType})`);
      announce("Gem config:");
      console.table([
        outputFormatter<LibGem.GemTypeMetadataStruct>(
          ["LastMint", "MaintenanceFee", "RewardRate", "DailyLimit", "MintCount", "DefoPrice", "StablePrice"],
          await gemGettersFacet.GetGemTypeMetadata(gemType),
        ),
      ]);

      announce(`User balance (${gemsGroupedByType[gemType]?.length || 0}):`);
      const userGems = gemsGroupedByType[gemType]?.map(gem => {
        const pickedGem = _.pick(gem, [
          "gemId",
          "MintTime",
          "LastReward",
          "LastMaintained",
          // "TaperCount",
          "booster",
          "claimedReward",
          "unclaimedReward",
          "claimable",
          "pendingMaintenance",
        ]) as unknown as Record<string, number | string>;
        const formattedGem: Record<string, string | number> = {};
        Object.keys(pickedGem).map(function (key) {
          formattedGem[key] = outputFormatKeyValue(key, pickedGem[key]);
        });
        return formattedGem;
      });
      userGems && console.table(userGems);
    }
  });
