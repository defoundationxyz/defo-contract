import { GEMS, gemName } from "@config";
import { IDEFODiamond } from "@contractTypes/index";
import { CompleteGemData, gemsGroupedByType } from "@utils/gems.helper";
import { announce, info, outputFormatKeyValue } from "@utils/output.helper";
import { task, types } from "hardhat/config";
import _ from "lodash";


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

    const gemContract = await ethers.getContract<IDEFODiamond>("DEFODiamond_DiamondProxy");
    const gemsOfDeployerGroupedByType = await gemsGroupedByType(gemContract);

    const types: number[] =
      gemTypeParam === -1
        ? gemIdParam > -1
          ? [(await gemContract.getGemInfo(gemIdParam)).gemTypeId]
          : Object.values(GEMS)
        : [gemTypeParam];

    announce(`Deployer ${deployer} has ${await gemContract.balanceOf(deployer)} gem(s)`);
    for (const type of types) {
      const balance = gemsOfDeployerGroupedByType[type]?.length || 0;
      announce(`\nGem ${gemName(type)} (type ${type}), balance: ${balance}`);
      const userGems =
        balance &&
        (
          await Promise.all(
            gemsOfDeployerGroupedByType[type]?.map(async gem => {
              if (gemIdParam == -1 || gem.gemId == gemIdParam) {
                const pickedGem = _.pick(gem, ["gemId", "reward"]) as Partial<CompleteGemData>;
                const formattedGem = {} as Record<keyof Partial<CompleteGemData>, string | number | bigint | boolean>;
                Object.keys(pickedGem).map(key => {
                  formattedGem[key as keyof Partial<CompleteGemData>] = outputFormatKeyValue(
                    key,
                    pickedGem[key as keyof Partial<CompleteGemData>],
                  );
                });
                if (gem.isClaimable) {
                  await gemContract.claimReward(gem.gemId);
                  formattedGem.claimedGross = Number(
                    fromWei((await gemContract.getGemInfo(gem.gemId)).fi.claimedGross),
                  );
                  formattedGem.claimedNet = Number(fromWei((await gemContract.getGemInfo(gem.gemId)).fi.claimedNet));
                  formattedGem.claimTaxPaid = Number(
                    fromWei((await gemContract.getGemInfo(gem.gemId)).fi.claimTaxPaid),
                  );
                } else {
                  formattedGem.claimedGross = "Not claimable";
                  formattedGem.claimedNet = "Not claimable";
                  formattedGem.claimTaxPaid = "Not claimable";
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
