import { GemFacet } from "@contractTypes/contracts/facets";
import { GemGettersFacet, LibGem } from "@contractTypes/contracts/facets/GemGettersFacet";

export const gemsGroupedByType = async (gemContract: GemFacet & GemGettersFacet, account: string) => {
  const gemIds = await gemContract.getGemIdsOf(account);
  const gemsIdsWithData = await Promise.all(
    gemIds.map(async gemId => {
      return {
        gemId: Number(gemId),
        unclaimedReward: await gemContract.checkTaperedReward(gemId),
        pendingMaintenance: await gemContract.checkPendingMaintenance(gemId),
        claimable: await gemContract.isClaimable(gemId),
        ...(await gemContract.GemOf(gemId)),
      };
    }),
  );
  return gemsIdsWithData.reduce(
    (r, v, i, a, k = v.GemType) => ((r[k] || (r[k] = [])).push(v), r),
    {} as Array<Array<LibGem.GemStructOutput & { gemId: number }>>,
  );
};
