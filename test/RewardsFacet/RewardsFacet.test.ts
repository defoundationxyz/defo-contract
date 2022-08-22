import { GEMS, GEM_TYPES_CONFIG, fromWei, gemName } from "@config";
import { RewardsFacet } from "@contractTypes/contracts/facets";
import { getContractWithSigner } from "@utils/chain.helper";
import { expect } from "chai";
import newDebug from "debug";
import { BigNumber } from "ethers";
import hardhat, { deployments, ethers } from "hardhat";


const debug = newDebug("defo:YieldGemFacet.test.ts");

describe("RewardsFacet", () => {
  let contract: RewardsFacet;
  const testAmountToStake = (id: number) => GEM_TYPES_CONFIG[id].rewardAmountDefo as BigNumber;

  beforeEach(async () => {
    await deployments.fixture([
      "DEFOToken",
      "LiquidityPairDAI-DEFO",
      "DEFODiamond",
      "DEFOTokenInit",
      "DiamondInitialized",
    ]);
    contract = await getContractWithSigner<RewardsFacet>(hardhat, "DEFODiamond");
    await hardhat.run("dev:get-some-dai");
    await hardhat.run("get-some-defo");
    await hardhat.run("permit");
    await hardhat.run("get-some-gems");
    await hardhat.run("jump-in-time");
  });

  describe("getRewardAmount(uint256 _tokenId)", () => {
    it("should earn reward with a given amount after one week", async () => {
      for (const i of Object.values(GEMS)) {
        debug(`getting reward amount of gem type ${gemName(i)}`);
        expect(await contract.getRewardAmount(i)).to.be.equal(testAmountToStake(i));
      }
    });
    it("should show zero amount for the gems once staked", async () => {
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
    it("should claim reward for every configured type", async () => {
      for (const i of Object.values(GEMS)) {
        debug(`claiming gem type ${gemName(i)}`);
        expect(await contract.claimReward(i));
      }
    });
  });

  describe("stakeReward(uint256 _tokenId, uint256 _amount)", () => {
    it("should stake all earned reward to the vault", async () => {
      for (const i of Object.values(GEMS)) {
        debug(`staking the reward to the vault, complete amount ${gemName(i)}`);
        expect(await contract.stakeReward(i, testAmountToStake(i)));
        expect(await contract.getRewardAmount(i)).to.be.equal(ethers.constants.Zero);
      }
    });
  });

  ///todo add batchclaim batch stake
});
