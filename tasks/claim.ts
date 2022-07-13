import { GEMS, gemName } from "@config";
import { CompleteGemData, gemsGroupedByType } from "@utils/gems.helper";
import { announce, info, outputFormatKeyValue } from "@utils/output.helper";
import { task, types } from "hardhat/config";
import _ from "lodash";

import { ERC721Facet, GemFacet, GemGettersFacet } from "../types";

export default task("claim", "claim rewards for gem(s)")
  .addOptionalParam("id", "gem id to claim rewards for a specific gemId", -1, types.int)
  .addOptionalParam(
    "type",
    "claim for all gems of given type 0 - sapphire, 1 - ruby, 2 - diamond, all gems if empty",
    -1,
    types.int,
  )
  .setAction(async ({ id: gemIdParam, type: gemTypeParam }, hre) => {
    const {
      getNamedAccounts,
      ethers,
      ethers: {
        utils: { formatEther: fromWei },
      },
    } = hre;
    const { deployer } = await getNamedAccounts();

    const gemContract = await ethers.getContract<GemFacet & GemGettersFacet & ERC721Facet>("DEFODiamond_DiamondProxy");
    const types: number[] = !gemTypeParam || gemTypeParam === -1 ? Object.values(GEMS) : [gemTypeParam];

    const gemsOfDeployerGroupedByType = await gemsGroupedByType(gemContract, deployer);

    announce(`Deployer ${deployer} has ${await gemContract.balanceOf(deployer)} gem(s)`);
    for (const type of types) {
      announce(`\nGem ${gemName(type)} (type ${type}), balance: ${gemsOfDeployerGroupedByType[type]?.length || 0}`);
      const userGems = (
        await Promise.all(
          gemsOfDeployerGroupedByType[type]?.map(async gem => {
            if (gemIdParam == -1 || gem.gemId == gemIdParam) {
              const pickedGem = _.pick(gem, [
                "gemId",
                "rawReward",
                "taxedReward",
                "taperedReward",
              ]) as Partial<CompleteGemData>;
              const formattedGem = {} as Record<keyof Partial<CompleteGemData>, string | number | bigint> & {
                claimed: string | number;
              };
              Object.keys(pickedGem).map(key => {
                formattedGem[key as keyof Partial<CompleteGemData>] = outputFormatKeyValue(
                  key,
                  pickedGem[key as keyof Partial<CompleteGemData>],
                );
              });
              if (gem.isClaimable) {
                await gemContract.ClaimRewards(gem.gemId);
                formattedGem.claimed = Number(fromWei((await gemContract.GemOf(gem.gemId)).claimedReward));
              } else {
                formattedGem.claimed = "Not claimable";
              }
              return formattedGem;
            }
          }),
        )
      ).filter(el => el);
      userGems && userGems[0] && console.table(userGems);
    }
    info(`Total balance ${await gemContract.balanceOf(deployer)} gem(s)`);
  });
