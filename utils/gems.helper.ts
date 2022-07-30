import {
  ConfigFacet,
  MaintenanceFacet,
  RewardsFacet,
  VaultFacet,
  YieldGemFacet,
} from "@contractTypes/contracts/facets";
import { FiStruct, GemStruct } from "@contractTypes/contracts/facets/YieldGemFacet";
import { BigNumber } from "ethers";

export type CompleteGemData = GemStruct &
  FiStruct & {
    gemId: number;
    reward: BigNumber;
    pendingMaintenance: BigNumber;
    isClaimable: boolean;
  };

export const gemsIdsWithData =
  (gemContract: YieldGemFacet & RewardsFacet & MaintenanceFacet) => async (): Promise<Array<CompleteGemData>> =>
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

export const gemsGroupedByType = async (gemContract: YieldGemFacet & RewardsFacet & MaintenanceFacet) =>
  (await gemsIdsWithData(gemContract)()).reduce(
    (r, v, i, a, k = v.gemTypeId) => ((r[k as number] || (r[k as number] = [])).push(v), r),
    {} as Array<Array<CompleteGemData>>,
  );
