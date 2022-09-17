import { FiStruct, GemStruct } from "@contractTypes/contracts/interfaces/IYieldGem";
import { IDEFODiamond } from "@contractTypes/index";
import { BigNumber } from "ethers";

export type CompleteGemData = GemStruct &
  FiStruct & {
    gemId: number;
    reward: BigNumber;
    pendingMaintenance: BigNumber;
    isClaimable: boolean;
  };

export const gemsIdsWithData =
  (gemContract: IDEFODiamond, user?: string) => async (): Promise<Array<CompleteGemData>> =>
    Promise.all(
      (user ? await gemContract.getGemIdsOf(user) : await gemContract.getGemIds()).map(async gemId => {
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

export const gemsGroupedByType = async (gemContract: IDEFODiamond, user?: string) =>
  (await gemsIdsWithData(gemContract, user)()).reduce(
    (r, v, i, a, k = v.gemTypeId) => ((r[k as number] || (r[k as number] = [])).push(v), r),
    {} as Array<Array<CompleteGemData>>,
  );
