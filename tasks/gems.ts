import { GEMS, gemName } from "@config";
import { GemTypeConfigStructOutput } from "@contractTypes/contracts/facets/ConfigFacet";
import { IDEFODiamond } from "@contractTypes/index";
import { CompleteGemData, gemsGroupedByType } from "@utils/gems.helper";
import {
  announce,
  getChainTime,
  info,
  isKey,
  networkInfo,
  outputFormatKeyValue,
  outputFormatter,
  table,
  warning,
} from "@utils/output.helper";
import chalk from "chalk";
import { task, types } from "hardhat/config";
import _ from "lodash";

export default task("gems", "get gems info and balance information for the deployer")
  .addOptionalParam("type", "0 - sapphire, 1 - ruby, 2 - diamond, empty (-1) - get info for all three", -1, types.int)
  .addOptionalParam("user", "specify address to check", undefined, types.string)
  .setAction(async ({ type, user }, hre) => {
    const {
      getNamedAccounts,
      ethers,
      ethers: {
        utils: { formatEther: fromWei },
      },
    } = hre;
    const { deployer } = await getNamedAccounts();
    await networkInfo(hre, info);
    info("📡 Querying gems...");
    info(`Current block time: ${chalk.green(await getChainTime(hre.ethers.provider))}`);

    const participant = user ?? deployer;

    const gemContract = await ethers.getContract<IDEFODiamond>("DEFODiamond_DiamondProxy");
    const types: number[] = type === -1 ? Object.values(GEMS) : [type];
    const gemsOfDeployerGroupedByType = await gemsGroupedByType(gemContract, participant);

    // headliner, deployer data
    announce(`${participant} has ${await gemContract.balanceOf(participant)} gem(s)`);
    info(`Total Charity: ${fromWei(await gemContract.getTotalDonatedOf(participant))}`);

    // gemtype config output
    const gemTypesConfig: GemTypeConfigStructOutput[] = await gemContract.getGemTypesConfig();
    for (const gemType of types) {
      warning(`\n\nGem ${gemName(gemType)} (type ${gemType})`);
      announce("Gem config:");
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { price, ...outputTable } = {
        ...gemTypesConfig[gemType],
        priceDai: gemTypesConfig[gemType].price[0],
        priceDefo: gemTypesConfig[gemType].price[1],
        isMintAvailable: await gemContract.isMintAvailable(gemType),
      };
      console.table([outputFormatter(outputTable)]);

      const userGemsOfType = gemsOfDeployerGroupedByType[gemType];

      announce(`User balance (${userGemsOfType?.length || 0}) gem(s)`);

      const allDetailsExceptRewardFilter = (i: keyof CompleteGemData) =>
        (isNaN(Number(i)) && !onlyFi(i) && !onlyRewardFilter(i) && i != "fi") || i == "gemId";
      const onlyRewardFilter = (i: keyof CompleteGemData) => i.match("reward|tax|gemId");
      const onlyFi = (i: keyof CompleteGemData) =>
        i == "gemId" ||
        i.match(
          "claimedGross|claimedNet|stakedGross|stakedNet|unStakedGross|unStakedNet|donated|claimTaxPaid|vaultTaxPaid",
        );

      // gem details
      for (const filterPredicate of [
        { message: "Main info", func: allDetailsExceptRewardFilter },
        { message: "Totals", func: onlyFi },
        { message: "Pending Rewards", func: onlyRewardFilter },
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
