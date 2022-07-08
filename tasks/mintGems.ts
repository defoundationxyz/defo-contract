import { task, types } from "hardhat/config";
import _ from "lodash";

import { gemName, gems } from "../constants";
import { ERC721Facet, GemFacet, GemGettersFacet } from "../types";
import { LibGem } from "../types/contracts/facets/GemGettersFacet";
import { announce, error, info, outputFormatKeyValue, outputFormatter, success, warning } from "../utils/helpers";

export default task("mint-some-gems", "mint all NFTs")
  .addOptionalParam(
    "account",
    "The account name to get defo, e.g. 'treasury', 'vault', or 'all'",
    "deployer",
    types.string,
  )
  .addOptionalParam("gemType", "0 - sapphire, 1 - ruby, 2 - diamond", -1, types.int)
  .setAction(async ({ gemType }, hre) => {
    const { getNamedAccounts, deployments, ethers } = hre;
    const { deployer } = await getNamedAccounts();

    const diamondDeployment = await deployments.get("DEFODiamond");
    const gemFacetContract = await ethers.getContractAt<GemFacet>("GemFacet", diamondDeployment.address);
    const gemGettersFacet = await ethers.getContractAt<GemGettersFacet>("GemGettersFacet", diamondDeployment.address);
    const gemNFT = await ethers.getContractAt<ERC721Facet>("ERC721Facet", diamondDeployment.address);
    const types: number[] = gemType === -1 ? Object.values(gems) : [gemType];

    const gemIds = await gemFacetContract.getGemIdsOf(deployer);
    const gemsIdsWithData = await Promise.all(
      gemIds.map(async gemId => {
        return { gemId: Number(gemId), ...(await gemGettersFacet.GemOf(gemId)) };
      }),
    );

    const gemsGroupedByType = gemsIdsWithData.reduce(
      (r, v, i, a, k = v.GemType) => ((r[k] || (r[k] = [])).push(v), r),
      {} as Array<Array<LibGem.GemStructOutput & { gemId: number }>>,
    );
    announce(`Deployer ${deployer} has ${await gemNFT.balanceOf(deployer)} gem(s)`);
    info(`Total Charity: ${await gemGettersFacet.getTotalCharity()}`);

    for (const type of types) {
      warning(`\n\nGem ${gemName(type)} (type ${type})`);
      announce("Gem config:");
      console.table([
        outputFormatter<LibGem.GemTypeMetadataStruct>(
          ["LastMint", "MaintenanceFee", "RewardRate", "DailyLimit", "MintCount", "DefoPrice", "StablePrice"],
          await gemGettersFacet.GetGemTypeMetadata(type),
        ),
      ]);

      announce(`User balance: ${gemsGroupedByType[type].length}:`);
      const userGems = gemsGroupedByType[type].map(gem => {
        const pickedGem = _.pick(gem, [
          "LastReward",
          "LastMaintained",
          "TaperCount",
          "booster",
          "claimedReward",
        ]) as unknown as Record<string, number | string>;
        const formattedGem: Record<string, string | number> = {};
        Object.keys(pickedGem).map(function (key) {
          formattedGem[key] = outputFormatKeyValue(key, pickedGem[key]);
        });
        return formattedGem;
      });
      console.table(userGems);

      if (await gemGettersFacet.isMintAvailableForGem(type)) {
        await gemFacetContract.MintGem(type);
        success(`${gemName(type)} gem minted, total gem balance ${await gemNFT.balanceOf(deployer)}`);
      } else {
        error("Mint not available");
      }
    }
    info(`Total balance ${await gemNFT.balanceOf(deployer)} gem(s)`);
  });
