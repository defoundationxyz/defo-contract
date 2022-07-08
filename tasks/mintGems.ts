import { task, types } from "hardhat/config";
import _ from "lodash";

import { gemName, gems } from "../constants";
import { ERC721Facet, GemFacet, GemGettersFacet } from "../types";
import { LibGem } from "../types/contracts/facets/GemGettersFacet";
import { announce, error, info, success } from "../utils/helpers";

export default task("get-some-gems", "mint all NFTs")
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
    for (const type of types) {
      announce(`\nGem ${gemName(type)} (type ${type}), balance: ${gemsGroupedByType[type]?.length || 0}`);
      if (await gemGettersFacet.isMintAvailableForGem(type)) {
        await gemFacetContract.MintGem(type);
        success(`Minted, total balance ${await gemNFT.balanceOf(deployer)} gem(s)`);
      } else {
        error("Mint not available");
      }
    }
    info(`Total balance ${await gemNFT.balanceOf(deployer)} gem(s)`);
  });
