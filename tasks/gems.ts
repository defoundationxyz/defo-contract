import { GEMS, gemName } from "@config";
import { CompleteGemData, gemsGroupedByType } from "@utils/gems.helper";
import {
  announce,
  getChainTime,
  info,
  success,
  isKey,
  outputFormatKeyValue,
  outputFormatter,
  table,
  warning,
} from "@utils/output.helper";
import { task, types } from "hardhat/config";
import _ from "lodash";

import { ERC721Facet, GemFacet, GemGettersFacet } from "../types";
import { LibGem } from "../types/contracts/facets/GemGettersFacet";
import chalk from "chalk";

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
    info(`Current block time: ${chalk.green(await getChainTime(hre.ethers.provider))}`);

    const gemContract = await ethers.getContract<GemFacet & GemGettersFacet & ERC721Facet>("DEFODiamond_DiamondProxy");
    const types: number[] = type === -1 ? Object.values(GEMS) : [type];
    const gemsOfDeployerGroupedByType = await gemsGroupedByType(gemContract, deployer);

    announce(`Deployer ${deployer} has ${await gemContract.balanceOf(deployer)} gem(s)`);
    info(`Total Charity: ${fromWei(await gemContract.getTotalCharity())}`);

    for (const gemType of types) {
      warning(`\n\nGem ${gemName(gemType)} (type ${gemType})`);
      announce("Gem config:");
      console.table([
        outputFormatter<LibGem.GemTypeMetadataStruct & { isMintAvailableForGem: boolean }>({
          ...(await gemContract.GetGemTypeMetadata(gemType)),
          isMintAvailableForGem: await gemContract.isMintAvailableForGem(gemType),
        }),
      ]);

      const userGemsOfType = gemsOfDeployerGroupedByType[gemType];

      announce(`User balance (${userGemsOfType?.length || 0}) gem(s)`);

      const allDetailsExceptRewardFilter = (i: keyof CompleteGemData) =>
        (isNaN(Number(i)) && i !== "GemType" && !onlyRewardFilter(i)) || i == "gemId";
      const onlyRewardFilter = (i: keyof CompleteGemData) => i.match("Reward|tax|gemId");

      for (const filterPredicate of [
        { message: "Main info", func: allDetailsExceptRewardFilter },
        { message: "Rewards related info", func: onlyRewardFilter },
      ]) {
        const userGemsOfTypeForOutput = userGemsOfType?.map(gem => {
          const gemWithFieldsToShow = _.pick(
            gem,
            (<Array<keyof CompleteGemData>>Object.keys(gem)).filter(filterPredicate.func).sort(),
          ) as Partial<CompleteGemData>;

          const formattedGem = {} as Record<keyof Partial<CompleteGemData>, string | number | bigint | boolean>;
          Object.keys({ gemId: gemWithFieldsToShow.gemId, ...gemWithFieldsToShow }).map(key => {
            if (isKey(gemWithFieldsToShow, key))
              formattedGem[key] = outputFormatKeyValue(key, gemWithFieldsToShow[key]);
          });
          return formattedGem;
        });
        userGemsOfTypeForOutput?.length && info(filterPredicate.message);
        userGemsOfTypeForOutput?.length && table(userGemsOfTypeForOutput);
      }
    }
  });
