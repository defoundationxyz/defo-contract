import { GEMS, fromWei, gemName } from "@config";
import { VaultFacet, YieldGemFacet } from "@contractTypes/contracts/facets";
import { getContractWithSigner } from "@utils/chain.helper";
import { expect } from "chai";
import newDebug from "debug";
import { BigNumber } from "ethers";
import hardhat, { deployments, ethers } from "hardhat";

import { BOOSTERS, testAmountStaked, testAmountToStake, testAmountUnStaked } from "../testHelpers";


const debug = newDebug("defo:VaultFacet.test.ts");

describe("VaultFacet", () => {
  let contract: VaultFacet & YieldGemFacet;

  beforeEach(async () => {
    await deployments.fixture([
      "DEFOToken",
      "LiquidityPairDAI-DEFO",
      "DEFODiamond",
      "DEFOTokenInit",
      "DiamondInitialized",
    ]);
    contract = await getContractWithSigner<VaultFacet & YieldGemFacet>(hardhat, "DEFODiamond");
    await hardhat.run("dev:get-some-dai");
    await hardhat.run("get-some-defo");
    await hardhat.run("permit");
    await hardhat.run("get-some-gems");
    for (const booster of BOOSTERS) {
      for (const i of Object.values(GEMS)) {
        await contract.mintTo(i, contract.signer.getAddress(), booster.id);
      }
    }
    await hardhat.run("jump-in-time");
    for (const id of Object.values(GEMS)) {
      debug(`staking gem ${gemName(id)}`);
      await hardhat.run("vault", {
        op: "stake",
        id,
        amount: Number(fromWei(testAmountToStake(id))),
      });
    }
    let id = Object.values(GEMS).length;
    for (const booster of BOOSTERS) {
      for (const gemType of Object.values(GEMS)) {
        await hardhat.run("vault", {
          op: "stake",
          id,
          amount: Number(fromWei(booster.rewardsBoost(testAmountToStake(gemType)))),
        });
        id++;
      }
    }
  });

  describe("getStaked(uint256 _tokenId)", () => {
    it("should provide correct staked amount once staked", async () => {
      for (const id of Object.values(GEMS)) {
        debug(`testing ${gemName(id)}`);
        expect(await contract.getStaked(id)).to.be.equal(testAmountStaked(testAmountToStake(id)));
      }
    });
    BOOSTERS.forEach(booster =>
      it(`should provide correct staked amount once staked for ${booster.name} boosted gem`, async () => {
        let id = Object.values(GEMS).length * booster.id;
        for (const i of Object.values(GEMS)) {
          debug(`testing ${gemName(i)} ${booster.name} boosted`);
          expect(await contract.getStaked(id)).to.be.equal(
            testAmountStaked(booster.rewardsBoost(testAmountToStake(i))),
          );
          id++;
        }
      }),
    );
  });

  describe("unStakeReward(uint256 _tokenId, uint256 _amount)", () => {
    it("should unstake all the amount staked earlier and emit event", async () => {
      for (const id of Object.values(GEMS)) {
        debug(`testing ${gemName(id)}`);
        const staked = testAmountStaked(testAmountToStake(id));
        await expect(contract.unStakeReward(id, staked))
          .to.emit(contract, "UnStaked")
          .withArgs(await contract.signer.getAddress(), staked, testAmountUnStaked(staked));
      }
    });
    BOOSTERS.forEach(booster =>
      it(`should unstake all the amount staked earlier and emit event for ${booster.name} boosted gem`, async () => {
        let id = Object.values(GEMS).length * booster.id;
        for (const i of Object.values(GEMS)) {
          debug(`testing ${gemName(i)}`);
          const staked = testAmountStaked(booster.rewardsBoost(testAmountToStake(i)));
          const unStaked = testAmountUnStaked(staked, booster.vaultFeeReduction);
          await expect(contract.unStakeReward(id, staked))
            .to.emit(contract, "UnStaked")
            .withArgs(await contract.signer.getAddress(), staked, unStaked);
          id++;
        }
      }),
    );
  });

  describe("getTotalStaked()", () => {
    it("should return correct staked amount after staking", async () => {
      expect(await contract.getTotalStaked()).to.be.equal(
        Object.values(GEMS)
          .reduce<BigNumber>(
            (totalStaked, id) => totalStaked.add(testAmountStaked(testAmountToStake(id))),
            ethers.constants.Zero,
          )
          .add(
            BOOSTERS.reduce<BigNumber>(
              (totalStaked, booster) =>
                totalStaked.add(
                  Object.values(GEMS).reduce<BigNumber>(
                    (totalStaked, id) => totalStaked.add(testAmountStaked(booster.rewardsBoost(testAmountToStake(id)))),
                    ethers.constants.Zero,
                  ),
                ),
              ethers.constants.Zero,
            ),
          ),
      );
    });

    it("should return correct staked amount after staking and minting more gems", async () => {
      await hardhat.run("get-some-gems");
      expect(await contract.getTotalStaked()).to.be.equal(
        Object.values(GEMS)
          .reduce<BigNumber>(
            (totalStaked, id) => totalStaked.add(testAmountStaked(testAmountToStake(id))),
            ethers.constants.Zero,
          )
          .add(
            BOOSTERS.reduce<BigNumber>(
              (totalStaked, booster) =>
                totalStaked.add(
                  Object.values(GEMS).reduce<BigNumber>(
                    (totalStaked, id) => totalStaked.add(testAmountStaked(booster.rewardsBoost(testAmountToStake(id)))),
                    ethers.constants.Zero,
                  ),
                ),
              ethers.constants.Zero,
            ),
          ),
      );
    });
  });
});
