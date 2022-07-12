import { GEMS, gemName } from "@config";
import { gemsGroupedByType } from "@utils/gems.helper";
import { announce, info, outputFormatKeyValue, outputFormatter, warning } from "@utils/output.helper";
import { task, types } from "hardhat/config";
import _ from "lodash";

import { ERC721Facet, GemFacet, GemGettersFacet } from "../types";
import { LibGem } from "../types/contracts/facets/GemGettersFacet";

export default task("gems", "get gems info and balance information for the deployer")
  .addOptionalParam("type", "0 - sapphire, 1 - ruby, 2 - diamond, empty (-1) - get info for all three", -1, types.int)
  .setAction(async ({ type }, hre) => {
    const {
      getNamedAccounts,
      ethers,
      ethers: {
        utils: { formatEther: fromWei },
      },
    } = hre;
    const { deployer } = await getNamedAccounts();
    info("\n 📡 Querying gems...");

    const gemContract = await ethers.getContract<GemFacet & GemGettersFacet & ERC721Facet>("DEFODiamond_DiamondProxy");
    const types: number[] = type === -1 ? Object.values(GEMS) : [type];
    const gemsOfDeployerGroupedByType = await gemsGroupedByType(gemContract, deployer);

    announce(`Deployer ${deployer} has ${await gemContract.balanceOf(deployer)} gem(s)`);
    info(`Total Charity: ${fromWei(await gemContract.getTotalCharity())}`);

    for (const gemType of types) {
      warning(`\n\nGem ${gemName(gemType)} (type ${gemType})`);
      announce("Gem config:");
      console.table([
        outputFormatter<LibGem.GemTypeMetadataStruct>(
          ["LastMint", "MaintenanceFee", "RewardRate", "DailyLimit", "MintCount", "DefoPrice", "StablePrice"],
          await gemContract.GetGemTypeMetadata(gemType),
        ),
      ]);

      announce(`User balance (${gemsOfDeployerGroupedByType[gemType]?.length || 0}):`);
      const userGems = gemsOfDeployerGroupedByType[gemType]?.map(gem => {
        const gemWithFieldsToShow = _.pick(gem, [
          "gemId",
          "MintTime",
          "LastReward",
          "LastMaintained",
          // "TaperCount",
          "booster",
          "claimedReward",
          "taxedReward",
          "isClaimable",
          "pendingMaintenance",
        ]) as unknown as Record<string, number | string>;
        const formattedGem: Record<string, string | number> = {};
        Object.keys(gemWithFieldsToShow).map(key => {
          formattedGem[key] = outputFormatKeyValue(key, gemWithFieldsToShow[key]);
        });
        return formattedGem;
      });
      userGems && console.table(userGems);
    }
  });
