import { GEMS, gemName } from "@config";
import { IDEFODiamond } from "@contractTypes/index";
import { gemsGroupedByType } from "@utils/gems.helper";
import { announce, error, info, networkInfo, success } from "@utils/output.helper";
import { SignerWithAddress } from "hardhat-deploy-ethers/signers";
import { task, types } from "hardhat/config";

export default task("get-some-gems", "mint NFT gems")
  .addOptionalParam("type", "0 - sapphire, 1 - ruby, 2 - diamond, empty (-1) - mint all three", -1, types.int)
  .addOptionalParam("amount", "number of gems to be minted", 1, types.int)
  .addOptionalParam("user", "an address to impersonate (only for localhost forking mainent)", undefined, types.string)
  .setAction(async ({ type, amount, user }, hre) => {
    const { getNamedAccounts, ethers } = hre;
    const { deployer } = await getNamedAccounts();
    await networkInfo(hre, info);

    const participant = user ?? deployer;
    let signer: string | SignerWithAddress;
    if (user) {
      await hre.network.provider.request({
        method: "hardhat_impersonateAccount",
        params: [user],
      });
      signer = await hre.ethers.getSigner(user);
    } else signer = deployer;

    const gemContract = await ethers.getContract<IDEFODiamond>("DEFODiamond_DiamondProxy", signer);
    const types: number[] = type === -1 ? Object.values(GEMS) : [type];

    const gemsOfDeployerGroupedByType = await gemsGroupedByType(gemContract);

    announce(`${participant} has ${await gemContract.balanceOf(participant)} gem(s)`);
    for (const gemType of types) {
      const name = gemName(gemType);
      announce(`\nGem ${name} (type ${gemType}), balance: ${gemsOfDeployerGroupedByType[gemType]?.length || 0}`);
      try {
        await Promise.all(
          Array.from({ length: amount }, async () => {
            if (await gemContract.isMintAvailable(gemType)) {
              await gemContract.mint(gemType);
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
    success(`Total balance ${await gemContract.balanceOf(participant)} gem(s)`);
  });
