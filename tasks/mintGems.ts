import { GEMS, gemName } from "@config";
import { ERC721Facet, GemFacet, GemGettersFacet } from "@contractTypes/index";
import { gemsGroupedByType } from "@utils/gems.helper";
import { announce, error, info, success } from "@utils/output.helper";
import { task, types } from "hardhat/config";

export default task("get-some-gems", "mint NFT gems")
  .addOptionalParam("type", "0 - sapphire, 1 - ruby, 2 - diamond, empty (-1) - mint all three", -1, types.int)
  .addOptionalParam("amount", "number of gems to be minted", 1, types.int)
  .setAction(async ({ type, amount }, hre) => {
    const { getNamedAccounts, ethers } = hre;
    const { deployer } = await getNamedAccounts();

    const gemContract = await ethers.getContract<GemFacet & GemGettersFacet & ERC721Facet>("DEFODiamond_DiamondProxy");
    const types: number[] = type === -1 ? Object.values(GEMS) : [type];

    const gemsOfDeployerGroupedByType = await gemsGroupedByType(gemContract, deployer);

    announce(`Deployer ${deployer} has ${await gemContract.balanceOf(deployer)} gem(s)`);
    for (const gemType of types) {
      const name = gemName(gemType);
      announce(`\nGem ${name} (type ${gemType}), balance: ${gemsOfDeployerGroupedByType[gemType]?.length || 0}`);
      try {
        await Promise.all(
          Array.from({ length: amount }, async () => {
            if (await gemContract.isMintAvailableForGem(gemType)) {
              await gemContract.MintGem(gemType);
              info(`Minted +1 ${name}`);
            } else {
              throw new Error("Mint not available");
            }
          }),
        );
      } catch (e: unknown) {
        if (e instanceof Error && e.message === "Mint not available") error("Mint not available");
        else error("Mint failed - check DAI/DEFO balance and approvals.");
      }
    }
    success(`Total balance ${await gemContract.balanceOf(deployer)} gem(s)`);
  });
