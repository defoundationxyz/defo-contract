import { DIAMOND_GEM, GEMS, HUNDRED_PERCENT, PROTOCOL_CONFIG } from "@config";
import { VaultFacet } from "@contractTypes/contracts/facets";
import { getContractWithSigner } from "@utils/chain.helper";
import { expect } from "chai";
import { BigNumber } from "ethers";
import hardhat, { deployments } from "hardhat";


describe("VaultFacet", () => {
  let contract: VaultFacet;
  const TEST_GEM_ID = GEMS.diamond;
  const TEST_AMOUNT_TO_STAKE = DIAMOND_GEM.rewardAmountDefo as BigNumber;
  const TEST_AMOUNT_STAKED = TEST_AMOUNT_TO_STAKE.mul(
    HUNDRED_PERCENT - <number>PROTOCOL_CONFIG.charityContributionRate,
  ).div(HUNDRED_PERCENT);
  const TEST_AMOUNT_UNSTAKED = TEST_AMOUNT_STAKED.mul(
    HUNDRED_PERCENT - <number>PROTOCOL_CONFIG.vaultWithdrawalTaxRate,
  ).div(HUNDRED_PERCENT);

  beforeEach(async () => {
    await deployments.fixture([
      "DEFOToken",
      "LiquidityPairDAI-DEFO",
      "DEFODiamond",
      "DEFOTokenInit",
      "DiamondInitialized",
    ]);
    contract = await getContractWithSigner<VaultFacet>(hardhat, "DEFODiamond");
    await hardhat.run("dev:get-some-dai");
    await hardhat.run("get-some-defo");
    await hardhat.run("permit");
    await hardhat.run("get-some-gems");
    await hardhat.run("jump-in-time");
    await hardhat.run("vault", { op: "stake", id: TEST_GEM_ID, amount: 5 });
    // await hardhat.run("vault", { op: "stake", id: TEST_GEM_ID, amount: fromWei(TEST_AMOUNT_TO_STAKE) });
  });

  describe("getStaked(uint256 _tokenId)", () => {
    it("should provide correct staked amount once staked", async () => {
      expect(await contract.getStaked(TEST_GEM_ID)).to.be.equal(TEST_AMOUNT_STAKED);
    });
  });

  describe("unStakeReward(uint256 _tokenId, uint256 _amount)", () => {
    it("should unstake all the amount staked earlier and emit event", async () => {
      await expect(contract.unStakeReward(2, TEST_AMOUNT_STAKED))
        .to.emit(contract, "UnStaked")
        .withArgs(await contract.signer.getAddress(), TEST_AMOUNT_STAKED, TEST_AMOUNT_UNSTAKED);
    });
  });
});
