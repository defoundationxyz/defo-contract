import { YieldGemFacet } from "@contractTypes/contracts/facets";
import { GemStruct } from "@contractTypes/contracts/facets/YieldGemFacet";
import { BigNumber } from "ethers";
import { Address } from "hardhat-deploy/dist/types";

export type CompleteGemData = GemStruct & {
  gemId: number;
  reward: BigNumber;
  pendingMaintenance: BigNumber;
  isClaimable: boolean;
};

export const gemsIdsWithData = (gemContract: YieldGemFacet) => async (): Promise<Array<CompleteGemData>> =>
  Promise.all(
    (await gemContract.getGemIds()).map(async gemId => {
      const gem = await gemContract.getGemData(gemId);
      return {
        gemId: Number(gemId),
        reward: await gemContract.checkRawReward(gemId),
        taxedReward: await gemContract.checkTaxedReward(gemId),
        taperedReward: await gemContract.checkTaperedReward(gemId),
        pendingMaintenance: await gemContract.checkPendingMaintenance(gemId),
        isClaimable: await gemContract.isClaimable(gemId),
        isActive: await gemContract.isActive(gemId),
        taxTier: ["No pay", "30%", "30%", "15%", "No tax"][(await gemContract.getTaxTier(gemId)).toNumber()],
        nextTier: await gemContract.wenNextTaxTier(gem.LastReward),
        ...gem,
      };
    }),
  );

export const gemsGroupedByType = async (gemContract: GemFacet & GemGettersFacet, account: Address) =>
  (await gemsIdsWithData(gemContract, account)()).reduce(
    (r, v, i, a, k = v.GemType) => ((r[k as number] || (r[k as number] = [])).push(v), r),
    {} as Array<Array<CompleteGemData>>,
  );
