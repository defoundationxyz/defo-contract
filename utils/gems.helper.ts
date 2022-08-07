import { FiStruct, GemStruct } from "@contractTypes/contracts/facets/YieldGemFacet";
import { IMaintenance, IRewards, IYieldGem } from "@contractTypes/index";
import { BigNumber } from "ethers";


export type CompleteGemData = GemStruct &
  FiStruct & {
    gemId: number;
    reward: BigNumber;
    pendingMaintenance: BigNumber;
    isClaimable: boolean;
  };

export const gemsIdsWithData =
  (gemContract: IRewards & IMaintenance & IYieldGem) => async (): Promise<Array<CompleteGemData>> =>
    Promise.all(
      (await gemContract.getGemIds()).map(async gemId => {
        const gem = await gemContract.getGemInfo(gemId);
        return {
          gemId: Number(gemId),
          reward: await gemContract.getRewardAmount(gemId),
          pendingMaintenance: await gemContract.getPendingMaintenanceFee(gemId),
          isClaimable: await gemContract.isClaimable(gemId),
          taxTier: ["No pay", "30%", "30%", "15%", "No tax"][await gemContract.getTaxTier(gemId)],
          ...gem.fi,
          ...gem,
        };
      }),
    );

export const gemsGroupedByType = async (gemContract: IRewards & IMaintenance & IYieldGem) =>
  (await gemsIdsWithData(gemContract)()).reduce(
    (r, v, i, a, k = v.gemTypeId) => ((r[k as number] || (r[k as number] = [])).push(v), r),
    {} as Array<Array<CompleteGemData>>,
  );
