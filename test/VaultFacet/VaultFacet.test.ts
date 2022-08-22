import { GEMS, GEM_TYPES_CONFIG, HUNDRED_PERCENT, PROTOCOL_CONFIG, fromWei, gemName } from "@config";
import { VaultFacet } from "@contractTypes/contracts/facets";
import { getContractWithSigner } from "@utils/chain.helper";
import { expect } from "chai";
import newDebug from "debug";
import { BigNumber } from "ethers";
import hardhat, { deployments, ethers } from "hardhat";


const debug = newDebug("defo:VaultFacet.test.ts");

describe("VaultFacet", () => {
  let contract: VaultFacet;
  const testAmountToStake = (id: number) => GEM_TYPES_CONFIG[id].rewardAmountDefo as BigNumber;
  const testAmountStaked = (id: number) =>
    testAmountToStake(id)
      .mul(HUNDRED_PERCENT - <number>PROTOCOL_CONFIG.charityContributionRate)
      .div(HUNDRED_PERCENT);
  const testAmountUnStaked = (id: number) =>
    testAmountStaked(id)
      .mul(HUNDRED_PERCENT - <number>PROTOCOL_CONFIG.vaultWithdrawalTaxRate)
      .div(HUNDRED_PERCENT);

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
    for (const id of Object.values(GEMS)) {
      debug(`minting gem ${gemName(id)}`);
      await hardhat.run("vault", {
        op: "stake",
        id,
        amount: Number(fromWei(testAmountToStake(id))),
      });
    }
  });

  describe("getStaked(uint256 _tokenId)", () => {
    it("should provide correct staked amount once staked", async () => {
      for (const id of Object.values(GEMS)) {
        debug(`testing ${gemName(id)}`);
        expect(await contract.getStaked(id)).to.be.equal(testAmountStaked(id));
      }
    });
  });

  describe("unStakeReward(uint256 _tokenId, uint256 _amount)", () => {
    it("should unstake all the amount staked earlier and emit event", async () => {
      for (const id of Object.values(GEMS)) {
        debug(`testing ${gemName(id)}`);
        await expect(contract.unStakeReward(id, testAmountStaked(id)))
          .to.emit(contract, "UnStaked")
          .withArgs(await contract.signer.getAddress(), testAmountStaked(id), testAmountUnStaked(id));
      }
    });
  });

  describe("getTotalStaked()", () => {
    it("should return correct staked amount after staking", async () => {
      expect(await contract.getTotalStaked()).to.be.equal(
        Object.values(GEMS).reduce<BigNumber>(
          (totalStaked, id) => totalStaked.add(testAmountStaked(id)),
          ethers.constants.Zero,
        ),
      );
    });
    it("should return correct staked amount after staking and minting more gems", async () => {
      await hardhat.run("get-some-gems");
      expect(await contract.getTotalStaked()).to.be.equal(
        Object.values(GEMS).reduce<BigNumber>(
          (totalStaked, id) => totalStaked.add(testAmountStaked(id)),
          ethers.constants.Zero,
        ),
      );
    });
  });
});
