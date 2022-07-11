import { GEMS, gemName } from "@config";
import { LibGem } from "@contractTypes/contracts/facets/GemGettersFacet";
import { ERC721Facet, GemFacet, GemGettersFacet } from "@contractTypes/index";
import { announce, error, info, success } from "@utils/output.helper";
import { task, types } from "hardhat/config";
import _ from "lodash";

export default task("get-some-gems", "mint NFT gems")
  .addOptionalParam("type", "0 - sapphire, 1 - ruby, 2 - diamond, empty (-1) - mint all three", -1, types.int)
  .addOptionalParam("amount", "number of gems to be minted", 1, types.int)
  .setAction(async ({ type, amount }, hre) => {
    const { getNamedAccounts, deployments, ethers } = hre;
    const { deployer } = await getNamedAccounts();

    const diamondDeployment = await deployments.get("DEFODiamond");
    const gemFacetContract = await ethers.getContractAt<GemFacet>("GemFacet", diamondDeployment.address);
    const gemGettersFacet = await ethers.getContractAt<GemGettersFacet>("GemGettersFacet", diamondDeployment.address);
    const gemNFT = await ethers.getContractAt<ERC721Facet>("ERC721Facet", diamondDeployment.address);
    const types: number[] = type === -1 ? Object.values(GEMS) : [type];

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
    for (const gemType of types) {
      const name = gemName(gemType);
      announce(`\nGem ${name} (type ${gemType}), balance: ${gemsGroupedByType[gemType]?.length || 0}`);
      try {
        await Promise.all(
          Array.from({ length: amount }, async () => {
            if (await gemGettersFacet.isMintAvailableForGem(gemType)) {
              await gemFacetContract.MintGem(gemType);
              info(`Minted +1 ${name}`);
            } else {
              throw new Error("Mint not available");
            }
          }),
        );
      } catch (e: unknown) {
        error("Mint not available");
      }
    }
    success(`Total balance ${await gemNFT.balanceOf(deployer)} gem(s)`);
  });
