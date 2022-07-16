import { GemFacet } from "@contractTypes/contracts/facets";
import { GemGettersFacet, LibGem } from "@contractTypes/contracts/facets/GemGettersFacet";
import { BigNumber } from "ethers";
import { Address } from "hardhat-deploy/dist/types";

export type CompleteGemData = LibGem.GemStruct & {
  gemId: number;
  taxedReward: BigNumber;
  rawReward: BigNumber;
  taperedReward: BigNumber;
  pendingMaintenance: BigNumber;
  isClaimable: boolean;
};

export const gemsIdsWithData =
  (gemContract: GemFacet & GemGettersFacet, account: Address) => async (): Promise<Array<CompleteGemData>> =>
    Promise.all(
      (await gemContract.getGemIdsOf(account)).map(async gemId => {
        const gem = await gemContract.GemOf(gemId);
        return {
          gemId: Number(gemId),
          rawReward: await gemContract.checkRawReward(gemId),
          taxedReward: await gemContract.checkTaxedReward(gemId),
          taperedReward: await gemContract.checkTaperedReward(gemId),
          pendingMaintenance: await gemContract.checkPendingMaintenance(gemId),
          isClaimable: await gemContract.isClaimable(gemId),
          isActive: await gemContract.isActive(gemId),
          taxTier: ["100%", "30%", "20%", "10%", "No tax"][(await gemContract.getTaxTier(gemId)).toNumber()],
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
