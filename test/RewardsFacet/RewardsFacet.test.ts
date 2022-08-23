import { GEMS, GEM_TYPES_CONFIG, HUNDRED_PERCENT, PROTOCOL_CONFIG, fromWei, gemName } from "@config";
import { RewardsFacet } from "@contractTypes/contracts/facets";
import { getContractWithSigner } from "@utils/chain.helper";
import { expect } from "chai";
import newDebug from "debug";
import { BigNumber } from "ethers";
import hardhat, { deployments, ethers } from "hardhat";
import { Address } from "hardhat-deploy/dist/types";


const debug = newDebug("defo:YieldGemFacet.test.ts");

describe("RewardsFacet", () => {
  let contract: RewardsFacet;
  let user: Address;
  const testAmountToClaim = (id: number) => GEM_TYPES_CONFIG[id].rewardAmountDefo as BigNumber;
  const testAmountToStake = testAmountToClaim;
  const testAmountTax = (id: number, taxTier: number) =>
    testAmountToClaim(id)
      .mul(<number>PROTOCOL_CONFIG.taxRates[taxTier])
      .div(HUNDRED_PERCENT);
  const testAmountCharity = (id: number) =>
    testAmountToClaim(id)
      .mul(<number>PROTOCOL_CONFIG.charityContributionRate)
      .div(HUNDRED_PERCENT);

  const testAmountClaimed = (id: number, taxTier: number) =>
    testAmountToClaim(id).sub(testAmountCharity(id)).sub(testAmountTax(id, taxTier));

  beforeEach(async () => {
    await deployments.fixture([
      "DEFOToken",
      "LiquidityPairDAI-DEFO",
      "DEFODiamond",
      "DEFOTokenInit",
      "DiamondInitialized",
    ]);
    contract = await getContractWithSigner<RewardsFacet>(hardhat, "DEFODiamond");
    user = (await hardhat.getNamedAccounts()).deployer;
    await hardhat.run("dev:get-some-dai");
    await hardhat.run("get-some-defo");
    await hardhat.run("permit");
    await hardhat.run("get-some-gems");
  });

  describe("getRewardAmount(uint256 _tokenId)", () => {
    it("should earn reward with a given amount after one week", async () => {
      await hardhat.run("jump-in-time");
      for (const i of Object.values(GEMS)) {
        debug(`getting reward amount of gem type ${gemName(i)}`);
        expect(await contract.getRewardAmount(i)).to.be.equal(testAmountToStake(i));
      }
    });
    it("should show zero amount for the gems once staked", async () => {
      await hardhat.run("jump-in-time");
      for (const id of Object.values(GEMS)) {
        debug(`getting reward amount of gem type ${gemName(id)}`);
        await hardhat.run("vault", {
          op: "stake",
          id,
          amount: Number(fromWei(testAmountToStake(id))),
        });
        expect(await contract.getRewardAmount(id)).to.be.equal(ethers.constants.Zero);
      }
    });
  });

  describe("claimReward(uint256 _tokenId)", () => {
    it("should claim reward for every configured gem type", async () => {
      await hardhat.run("jump-in-time");
      for (const i of Object.values(GEMS)) {
        debug(`claiming gem type ${gemName(i)}`);
        expect(await contract.claimReward(i));
      }
    });

    it("should revert if a week has not passed after mint", async () => {
      for (const i of Object.values(GEMS)) {
        debug(`claiming gem type ${gemName(i)}`);
        await expect(contract.claimReward(i)).to.be.revertedWith("Not claimable");
      }
    });

    it("should revert if no rewards to claim", async () => {
      await hardhat.run("jump-in-time");
      for (const i of Object.values(GEMS)) {
        debug(`claiming gem type ${gemName(i)}`);
        await contract.claimReward(i);
        await expect(contract.claimReward(i)).to.be.reverted;
      }
    });

    const testClaim = async (tax: number) => {
      for (const i of Object.values(GEMS)) {
        debug(`claiming gem type ${gemName(i)}`);
        debug(`testAmountToClaim(i) ${testAmountToClaim(i).toString()}`);
        debug(`testAmountClaimed ${testAmountClaimed(i, tax).toString()}`);
        //here times tax just to count the number of weeks passed to multiply rewards
        await expect(contract.claimReward(i))
          .to.emit(contract, "Claimed")
          .withArgs(user, testAmountToClaim(i).mul(tax), testAmountClaimed(i, tax).mul(tax));
      }
    };

    it("should claim reward for every configured gem type and event emitted with the correct amounts tax tier 1", async () => {
      await hardhat.run("jump-in-time");
      debug(`tax tier 1`);
      await testClaim(1);
    });

    it("should claim reward for every configured gem type and event emitted with the correct amounts tax tier 2", async () => {
      await hardhat.run("jump-in-time", { time: "2weeks" });
      debug(`tax tier 2`);
      await testClaim(2);
    });

    it("should claim reward for every configured gem type and event emitted with the correct amounts tax tier 3", async () => {
      await hardhat.run("jump-in-time", { time: "3weeks" });
      debug(`tax tier 3`);
      await testClaim(3);
    });

    it("should claim reward for every configured gem type and event emitted with the correct amounts tax tier 4 (no tax)", async () => {
      await hardhat.run("jump-in-time", { time: "4weeks" });
      debug(`tax tier 4`);
      await testClaim(4);
    });
  });

  describe("stakeReward(uint256 _tokenId, uint256 _amount)", () => {
    it("should stake all earned reward to the vault", async () => {
      await hardhat.run("jump-in-time");
      for (const i of Object.values(GEMS)) {
        debug(`staking the reward to the vault, complete amount ${gemName(i)}`);
        expect(await contract.stakeReward(i, testAmountToStake(i)));
        expect(await contract.getRewardAmount(i)).to.be.equal(ethers.constants.Zero);
      }
    });

    it("should revert on staking if a week has not passed after mint", async () => {
      for (const i of Object.values(GEMS)) {
        debug(`staking the reward to the vault, complete amount ${gemName(i)}`);
        await expect(contract.stakeReward(i, testAmountToStake(i))).to.be.reverted;
      }
    });

    it("should revert on staking if no claimable rewards", async () => {
      await hardhat.run("jump-in-time");
      for (const i of Object.values(GEMS)) {
        debug(`staking the reward to the vault, complete amount ${gemName(i)}`);
        await contract.stakeReward(i, testAmountToStake(i));
        await expect(contract.stakeReward(i, testAmountToStake(i))).to.be.reverted;
      }
    });
  });

  ///todo add batchclaim batch stake
});
