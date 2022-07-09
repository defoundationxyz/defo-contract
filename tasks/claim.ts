import chalk from "chalk";
import { task, types } from "hardhat/config";
import _ from "lodash";

import { gemName, gems } from "../constants";
import { ERC721Facet, GemFacet, GemGettersFacet } from "../types";
import { LibGem } from "../types/contracts/facets/GemGettersFacet";
import { announce, info, outputFormatKeyValue } from "../utils/helpers";

export default task("claim", "claim rewards for gem(s)")
  .addOptionalParam("id", "gem id to claim rewards for a specific gemId", -1, types.int)
  .addOptionalParam(
    "type",
    "claim for all gems of given type 0 - sapphire, 1 - ruby, 2 - diamond, all gems if empty",
    -1,
    types.int,
  )
  .setAction(async ({ id: gemIdParam, type: gemTypeParam }, hre) => {
    const { getNamedAccounts, deployments, ethers } = hre;
    const { deployer } = await getNamedAccounts();

    const diamondDeployment = await deployments.get("DEFODiamond");
    const gemFacetContract = await ethers.getContractAt<GemFacet>("GemFacet", diamondDeployment.address);
    const gemGettersFacet = await ethers.getContractAt<GemGettersFacet>("GemGettersFacet", diamondDeployment.address);
    const gemNFT = await ethers.getContractAt<ERC721Facet>("ERC721Facet", diamondDeployment.address);
    const types: number[] = !gemTypeParam || gemTypeParam === -1 ? Object.values(gems) : [gemTypeParam];

    const gemIds = await gemFacetContract.getGemIdsOf(deployer);
    const gemsIdsWithData = await Promise.all(
      gemIds.map(async gemId => {
        return {
          gemId: Number(gemId),
          ...(await gemGettersFacet.GemOf(gemId)),
          unclaimedReward: await gemFacetContract.checkRawReward(gemId),
          claimable: await gemFacetContract.isClaimable(gemId),
        };
      }),
    );
    const gemsGroupedByType = gemsIdsWithData.reduce(
      (r, v, i, a, k = v.GemType) => ((r[k] || (r[k] = [])).push(v), r),
      {} as Array<Array<LibGem.GemStructOutput & { gemId: number; claimable: boolean }>>,
    );
    announce(`Deployer ${deployer} has ${await gemNFT.balanceOf(deployer)} gem(s)`);
    for (const type of types) {
      announce(`\nGem ${gemName(type)} (type ${type}), balance: ${gemsGroupedByType[type]?.length || 0}`);
      const userGems = await Promise.all(
        gemsGroupedByType[type]?.map(async gem => {
          if (gemIdParam == -1 || gem.gemId == gemIdParam) {
            const pickedGem = _.pick(gem, ["gemId", "claimedReward", "unclaimedReward"]) as unknown as Record<
              string,
              number | string
            >;
            const formattedGem: Record<string, string | number> = {};
            Object.keys(pickedGem).map(key => {
              formattedGem[key] = outputFormatKeyValue(key, pickedGem[key]);
            });
            if (gem.claimable) {
              await gemFacetContract.ClaimRewards(gem.gemId);
              formattedGem.claimed = "Done";
            } else {
              formattedGem.claimed = "Not claimable";
            }
            return formattedGem;
          }
        }),
      );
      userGems && userGems[0] && console.table(userGems);
    }
    info(`Total balance ${await gemNFT.balanceOf(deployer)} gem(s)`);
  });
