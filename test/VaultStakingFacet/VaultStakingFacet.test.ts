import { GEMS } from "@config";
import { ERC721Facet, GemFacet, GemGettersFacet, VaultStakingFacet } from "@contractTypes/contracts/facets";
import { CompleteGemData, gemsGroupedByType, gemsIdsWithData } from "@utils/gems.helper";
import { expect } from "chai";
import newDebug from "debug";
import { deployments, ethers, run } from "hardhat";

const debug = newDebug("defo:VaultStakingFacet.test.ts");

describe("Vault Tests", function () {
  let contract: VaultStakingFacet & GemFacet & GemGettersFacet & ERC721Facet;
  let getGemsIds: () => Promise<Array<CompleteGemData>>;

  beforeEach(async function () {
    await deployments.fixture();
    await run("fork:get-some-dai");
    await run("get-some-defo");
    await run("permit");
    await run("get-some-gems");
    await run("jump-in-time", { time: "8d" });

    contract = await ethers.getContract<VaultStakingFacet & GemFacet & GemGettersFacet & ERC721Facet>(
      "DEFODiamond_DiamondProxy",
    );
    const [wallet] = await ethers.getSigners();
    getGemsIds = gemsIdsWithData(contract, wallet.address);
  });

  describe("staking taperedReward() to vault", () => {
    let gem: CompleteGemData;
    beforeEach(async () => {
      gem = (await getGemsIds()).filter(gem => gem.isClaimable && gem.taperedReward.gt(0))[0];
    });

    it("should add gem to vault", async () => {
      await contract.addToVault(gem.gemId, gem.taperedReward);
    });

    it("should deduct claimable amount from checkTaperedReward() return", async () => {
      await contract.addToVault(gem.gemId, gem.taperedReward);
      const unclaimed = await contract.checkTaperedReward(gem.gemId);
      expect(unclaimed.eq(0)).true;
    });

    it("should increase total staked amount", async () => {
      await contract.addToVault(gem.gemId, gem.taperedReward);
      const staked = await contract.showStakedAmount();
      expect(staked.eq(gem.taperedReward)).true;
    });
  });
});
