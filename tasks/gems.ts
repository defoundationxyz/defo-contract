import { task } from "hardhat/config";
import _ from "lodash";

import { gemName, gems } from "../constants";
import { ERC721Facet, GemFacet, GemGettersFacet } from "../types";
import { LibGem } from "../types/contracts/facets/GemGettersFacet";
import { announce, info, outputFormatKeyValue, outputFormatter, warning } from "../utils/helpers";

export default task("gems", "get gems info and balance information for the deployer").setAction(async (_x, hre) => {
  const { getNamedAccounts, deployments, ethers } = hre;
  const { deployer } = await getNamedAccounts();

  const diamondDeployment = await deployments.get("DEFODiamond");
  const gemFacetContract = await ethers.getContractAt<GemFacet>("GemFacet", diamondDeployment.address);
  const gemGettersFacet = await ethers.getContractAt<GemGettersFacet>("GemGettersFacet", diamondDeployment.address);
  const gemNFT = await ethers.getContractAt<ERC721Facet>("ERC721Facet", diamondDeployment.address);
  const types: number[] = Object.values(gems);

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

    announce(`User balance (${gemsGroupedByType[type]?.length || 0}):`);
    const userGems = gemsGroupedByType[type].map(gem => {
      const pickedGem = _.pick(gem, [
        "gemId",
        "MintTime",
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
  }
});
