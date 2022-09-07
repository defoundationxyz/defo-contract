import { GEMS, HUNDRED_PERCENT, PROTOCOL_CONFIG, fromWei, gemName, percent } from "@config";
import { MaintenanceFacet, RewardsFacet, YieldGemFacet } from "@contractTypes/contracts/facets";
import { getContractWithSigner } from "@utils/chain.helper";
import { expect } from "chai";
import newDebug from "debug";
import { BigNumber } from "ethers";
import hardhat, { deployments, ethers } from "hardhat";
import { Address } from "hardhat-deploy/dist/types";

import { BOOSTERS, testAmountClaimed, testAmountToClaim, testAmountToStake } from "../testHelpers";

const debug = newDebug("defo:RewardsFacet.test.ts");

describe("RewardsFacet", () => {
  let contract: RewardsFacet & YieldGemFacet & MaintenanceFacet;
  let otherUserContract: RewardsFacet & YieldGemFacet;
  let user: Address;
  let otherUser: Address;

  beforeEach(async () => {
    await deployments.fixture([
      "DEFOToken",
      "LiquidityPairDAI-DEFO",
      "DEFODiamond",
      "DEFOTokenInit",
      "DiamondInitialized",
    ]);
    contract = await getContractWithSigner<RewardsFacet & YieldGemFacet & MaintenanceFacet>(hardhat, "DEFODiamond");
    user = (await hardhat.getNamedAccounts()).deployer;
    const ANY_USER = { id: 3, name: "team" };
    otherUser = (await hardhat.ethers.getSigners())[ANY_USER.id].address;
    otherUserContract = await getContractWithSigner<RewardsFacet & YieldGemFacet>(
      hardhat,
      "DEFODiamond",
      ANY_USER.name,
    );
    await hardhat.run("get-some-dai");
    await hardhat.run("get-some-defo");
    await hardhat.run("permit");
  });

  describe("getRewardAmount(uint256 _tokenId)", () => {
    it("should earn reward with a given amount after one week", async () => {
      await hardhat.run("get-some-gems");
      await hardhat.run("jump-in-time", { time: `${(<number>PROTOCOL_CONFIG.rewardPeriod + 1).toString()}s` });
      for (const i of Object.values(GEMS)) {
        debug(`testing reward amount of gem type: ${gemName(i)}`);
        expect(await contract.getRewardAmount(i)).to.be.equal(testAmountToStake(i));
      }
    });

    //todo tapering test
    // Object.values(GEMS).forEach(i =>
    //   it(`should taper reward for gem ${gemName(i)}`, async () => {
    //     let reward = ethers.constants.Zero;
    //     await hardhat.run("get-some-gems", { type: i });
    //     while (reward.lt(<BigNumber>GEM_TYPES_CONFIG[i].taperRewardsThresholdDefo)) {
    //       await hardhat.run("jump-in-time", { time: `${(<number>PROTOCOL_CONFIG.rewardPeriod + 1).toString()}s` });
    //       reward = await contract.getRewardAmount(0);
    //     }
    //     await hardhat.run("jump-in-time", { time: `${(<number>PROTOCOL_CONFIG.rewardPeriod + 1).toString()}s` });
    //     const expectedTaperedReward = await contract.getRewardAmount(0);
    //     const taperedForAWeek = expectedTaperedReward.sub(reward);
    //     expect(taperedForAWeek).to.be.equal(
    //       testAmountToStake(0)
    //         .mul(HUNDRED_PERCENT - <number>PROTOCOL_CONFIG.taperRate)
    //         .div(HUNDRED_PERCENT),
    //     );
    //   }),
    // );

    BOOSTERS.forEach(booster =>
      it(`should earn correct reward for ${booster.name} boosted gem`, async () => {
        for (const i of Object.values(GEMS)) {
          await contract.mintTo(i, user, booster.id);
        }
        await hardhat.run("jump-in-time", { time: `${(<number>PROTOCOL_CONFIG.rewardPeriod + 1).toString()}s` });
        for (const i of Object.values(GEMS)) {
          debug(`testing reward amount of  ${booster.name} boosted gem type: ${gemName(i)}`);
          expect(await contract.getRewardAmount(i)).to.be.equal(booster.rewardsBoost(testAmountToStake(i)));
        }
      }),
    );

    it("should show zero amount for the gems once staked", async () => {
      await hardhat.run("get-some-gems");
      await hardhat.run("jump-in-time", { time: `${(<number>PROTOCOL_CONFIG.rewardPeriod + 1).toString()}s` });
      for (const id of Object.values(GEMS)) {
        debug(`testing staking for gem type: ${gemName(id)}`);
        await hardhat.run("vault", {
          op: "stake",
          id,
          amount: Number(fromWei(testAmountToStake(id))),
        });
        expect(await contract.getRewardAmount(id)).to.be.equal(ethers.constants.Zero);
      }
    });
  });

  describe("isClaimable(uint256 _tokenId)", () => {
    it("should be claimable where there's a pending reward and no maintenance yet", async () => {
      await hardhat.run("get-some-gems");
      await hardhat.run("jump-in-time", { time: `${(<number>PROTOCOL_CONFIG.rewardPeriod + 1).toString()}s` });
      for (const id of Object.values(GEMS)) {
        const x = await contract.isClaimable(id);
        debug(`testing  gem type: ${gemName(id)}: isClaimable: ${x}`);
        expect(x).to.be.true;
      }
    });

    it("should not be claimable if maintenance is not paid", async () => {
      await hardhat.run("get-some-gems");
      await hardhat.run("jump-in-time", { time: `${(<number>PROTOCOL_CONFIG.maintenancePeriod + 1).toString()}s` });
      for (const id of Object.values(GEMS)) {
        debug(`testing  gem type: ${gemName(id)}`);
        const x = await contract.isClaimable(id);
        expect(x).to.be.false;
      }
    });

    it("should be claimable once maintenance is paid", async () => {
      await hardhat.run("get-some-gems");
      await hardhat.run("jump-in-time", { time: `${(<number>PROTOCOL_CONFIG.maintenancePeriod + 1).toString()}s` });
      for (const id of Object.values(GEMS)) {
        debug(`testing  gem type: ${gemName(id)}`);
        await contract.maintain(id);
        expect(await contract.isClaimable(id)).to.be.true;
      }
    });

    it("should not be claimable once complete reward is staked", async () => {
      await hardhat.run("get-some-gems");
      await hardhat.run("jump-in-time", { time: `${(<number>PROTOCOL_CONFIG.rewardPeriod + 1).toString()}s` });
      for (const id of Object.values(GEMS)) {
        debug(`testing staking for gem type: ${gemName(id)}`);
        await hardhat.run("vault", {
          op: "stake",
          id,
          amount: Number(fromWei(testAmountToStake(id))),
        });
        expect(await contract.isClaimable(id)).to.be.false;
      }
    });
  });

  describe("getCumulatedReward()", () => {
    it("should return correct reward after one week for all gems", async () => {
      await hardhat.run("get-some-gems");
      await hardhat.run("jump-in-time", { time: `${(<number>PROTOCOL_CONFIG.rewardPeriod + 1).toString()}s` });
      expect(await contract.getCumulatedReward()).to.be.equal(
        Object.values(GEMS).reduce<BigNumber>(
          (totalReward, i) => totalReward.add(testAmountToStake(i)),
          ethers.constants.Zero,
        ),
      );
    });

    it("should transfer total reward if a gem had been transferred", async () => {
      await hardhat.run("get-some-gems");
      await hardhat.run("jump-in-time", { time: `${(<number>PROTOCOL_CONFIG.rewardPeriod + 1).toString()}s` });
      await Promise.all(
        Object.values(GEMS).map(i => contract["safeTransferFrom(address,address,uint256)"](user, otherUser, i)),
      );
      expect(await contract.getCumulatedReward()).to.be.equal(ethers.constants.Zero);
      expect(await otherUserContract.getCumulatedReward()).to.be.equal(
        Object.values(GEMS).reduce<BigNumber>(
          (totalReward, i) => totalReward.add(testAmountToStake(i)),
          ethers.constants.Zero,
        ),
      );
    });
  });

  describe("claimReward(uint256 _tokenId)", () => {
    it("should claim reward for every configured gem type", async () => {
      await hardhat.run("get-some-gems");
      await hardhat.run("jump-in-time", { time: `${(<number>PROTOCOL_CONFIG.rewardPeriod + 1).toString()}s` });
      for (const i of Object.values(GEMS)) {
        debug(`claiming gem type: ${gemName(i)}`);
        expect(await contract.claimReward(i));
      }
    });

    it("should revert if a week has not passed after mint", async () => {
      await hardhat.run("get-some-gems");
      for (const i of Object.values(GEMS)) {
        debug(`claiming gem type: ${gemName(i)}`);
        await expect(contract.claimReward(i)).to.be.revertedWith("Not claimable");
      }
    });

    it("should revert if no rewards to claim", async () => {
      await hardhat.run("get-some-gems");
      await hardhat.run("jump-in-time", { time: `${(<number>PROTOCOL_CONFIG.rewardPeriod + 1).toString()}s` });
      for (const i of Object.values(GEMS)) {
        debug(`claiming gem type: ${gemName(i)}`);
        await contract.claimReward(i);
        await expect(contract.claimReward(i)).to.be.reverted;
      }
    });

    [1, 2, 3, 4].forEach(taxTier =>
      it(`should claim reward for every configured gem type and event emitted with the correct amounts tax tier ${taxTier}`, async () => {
        debug(`Tax tier ${taxTier} is ${<number>PROTOCOL_CONFIG.taxRates[taxTier] / 100}%`);
        await hardhat.run("get-some-gems");
        await hardhat.run("jump-in-time", { time: `${taxTier}weeks` });
        for (const i of Object.values(GEMS)) {
          debug(`claiming gem type: ${gemName(i)}`);
          //here times tax just to count the number of weeks passed to multiply rewards
          await expect(contract.claimReward(i))
            .to.emit(contract, "Claimed")
            .withArgs(user, testAmountToClaim(i).mul(taxTier), testAmountClaimed(i, taxTier).mul(taxTier));
        }
      }),
    );
  });

  describe("stakeReward(uint256 _tokenId, uint256 _amount)", () => {
    it("should stake all earned reward to the vault", async () => {
      await hardhat.run("get-some-gems");
      await hardhat.run("jump-in-time", { time: `${(<number>PROTOCOL_CONFIG.rewardPeriod + 1).toString()}s` });
      for (const i of Object.values(GEMS)) {
        debug(`staking the reward to the vault, complete amount ${gemName(i)}`);
        expect(await contract.stakeReward(i, testAmountToStake(i)));
        expect(await contract.getRewardAmount(i)).to.be.equal(ethers.constants.Zero);
      }
    });

    it("should stake a given amount and emit event", async () => {
      await hardhat.run("get-some-gems");
      await hardhat.run("jump-in-time", { time: `${(<number>PROTOCOL_CONFIG.rewardPeriod + 1).toString()}s` });
      for (const i of Object.values(GEMS)) {
        debug(`staking the reward to the vault ${gemName(i)}`);
        const TEST_AMOUNT = testAmountToStake(i).div(2);
        await expect(contract.stakeReward(i, TEST_AMOUNT))
          .to.emit(contract, "Staked")
          .withArgs(
            user,
            TEST_AMOUNT,
            TEST_AMOUNT.sub(TEST_AMOUNT.mul(<number>PROTOCOL_CONFIG.charityContributionRate).div(HUNDRED_PERCENT)),
          );
      }
    });

    it("should revert on staking if a week has not passed after mint", async () => {
      await hardhat.run("get-some-gems");
      for (const i of Object.values(GEMS)) {
        debug(`staking the reward to the vault, complete amount ${gemName(i)}`);
        await expect(contract.stakeReward(i, testAmountToStake(i))).to.be.reverted;
      }
    });

    it("should revert on staking if no claimable rewards", async () => {
      await hardhat.run("get-some-gems");
      await hardhat.run("jump-in-time", { time: `${(<number>PROTOCOL_CONFIG.rewardPeriod + 1).toString()}s` });
      for (const i of Object.values(GEMS)) {
        debug(`staking the reward to the vault, complete amount ${gemName(i)}`);
        await contract.stakeReward(i, testAmountToStake(i));
        await expect(contract.stakeReward(i, testAmountToStake(i))).to.be.reverted;
      }
    });
  });

  describe("stakeAndClaim(uint256 _tokenId, uint256 _percent)", () => {
    [20, 40, 60, 80].forEach(strategy => {
      it(`should claim and stake reward for every configured gem type for vault strategy ${strategy}`, async () => {
        await hardhat.run("get-some-gems");
        await hardhat.run("jump-in-time", { time: `${(<number>PROTOCOL_CONFIG.rewardPeriod + 1).toString()}s` });
        for (const i of Object.values(GEMS)) {
          debug(`gem ${gemName(i)}`);
          const TEST_AMOUNT = testAmountToStake(i).mul(strategy).div(100);
          await expect(contract.stakeAndClaim(i, percent(strategy)))
            .to.emit(contract, "Staked")
            .withArgs(
              user,
              TEST_AMOUNT,
              TEST_AMOUNT.sub(TEST_AMOUNT.mul(<number>PROTOCOL_CONFIG.charityContributionRate).div(HUNDRED_PERCENT)),
            );
        }
      });
    });
  });

  ///todo add batchclaim batch stake
});
