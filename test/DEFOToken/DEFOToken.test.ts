import { GEM_TYPES_CONFIG, fromWei, toWei } from "@config";
import { DEFOToken } from "@contractTypes/contracts/token";
import { getContractWithSigner } from "@utils/chain.helper";
import { expect } from "chai";
import { BigNumber } from "ethers";
import hardhat, { deployments } from "hardhat";
import { Address } from "hardhat-deploy/dist/types";

describe("DEFOToken", () => {
  const TEST_AMOUNT = toWei(1000);
  let defoContract: DEFOToken;
  let defoTokenOwner: Address;
  let deployer: Address;
  let otherUser: Address;

  beforeEach(async () => {
    await deployments.fixture([
      "DEFOToken",
      "DEFODiamond",
      "DEFOTokenInit",
      "LiquidityPairDAI-DEFO",
      "DiamondInitialized",
    ]);
    defoContract = await getContractWithSigner<DEFOToken>(hardhat, "DEFOToken", "defoTokenOwner");
    defoTokenOwner = (await hardhat.getNamedAccounts()).defoTokenOwner;
    deployer = (await hardhat.getNamedAccounts()).deployer;
    const ANY_NUMBER_NOT_0 = 3;
    otherUser = (await hardhat.ethers.getSigners())[ANY_NUMBER_NOT_0].address;
  });

  // describe("mint()", () => {
  //   it("should mint DEFO tokens to defoTokenOwner", async () => {
  //     await defoContract.mint(defoTokenOwner, TEST_AMOUNT);
  //     expect(await defoContract.balanceOf(defoTokenOwner)).to.be.equal(TEST_AMOUNT);
  //   });
  //   it("should mint DEFO tokens to any address if called by authorized party", async () => {
  //     await defoContract.mint(otherUser, TEST_AMOUNT);
  //     expect(await defoContract.balanceOf(otherUser)).to.be.equal(TEST_AMOUNT);
  //   });
  //   it("should not mint DEFO tokens to unauthorized party", async () => {
  //     const contractFromOtherUser = await getContractWithSigner<DEFOToken>(hardhat, "DEFOToken", "donations");
  //     await expect(contractFromOtherUser.mint(otherUser, TEST_AMOUNT)).to.be.revertedWith("DEFOToken:not-authorized");
  //   });
  // });

  describe("transferFrom()", () => {
    it("should transfer DEFO to another user any amount", async () => {
      await defoContract.mint(defoTokenOwner, TEST_AMOUNT);
      await defoContract.deny(defoTokenOwner);
      await defoContract.transfer(otherUser, TEST_AMOUNT);
      expect(await defoContract.balanceOf(otherUser)).to.be.equal(TEST_AMOUNT);
    });

    it("should swap DEFO to DAI past one week if amount equal to weekly rewards", async () => {
      await defoContract.mint(deployer, TEST_AMOUNT);
      await defoContract.deny(deployer);
      await hardhat.run("get-some-dai");
      await hardhat.run("permit");
      await hardhat.run("get-some-gems");
      await hardhat.run("jump-in-time");
      const balance = await defoContract.balanceOf(deployer);
      const AMOUNT = GEM_TYPES_CONFIG.reduce<BigNumber>(
        (totalReward, gemConfig) => totalReward.add(gemConfig.rewardAmountDefo as BigNumber),
        hardhat.ethers.constants.Zero,
      );

      await hardhat.run("swap", { defo: fromWei(AMOUNT) });
      expect(await defoContract.balanceOf(deployer)).to.be.equal(balance.sub(AMOUNT));
    });

    it("should allow DEFO sold cumulatively by small amounts up to weekly rewards in total", async () => {
      await defoContract.mint(deployer, TEST_AMOUNT);
      await defoContract.deny(deployer);
      await hardhat.run("get-some-dai");
      await hardhat.run("permit");
      await hardhat.run("get-some-gems");
      await hardhat.run("jump-in-time");
      const balance = await defoContract.balanceOf(deployer);
      const AMOUNT = GEM_TYPES_CONFIG.reduce<BigNumber>(
        (totalReward, gemConfig) => totalReward.add(gemConfig.rewardAmountDefo as BigNumber),
        hardhat.ethers.constants.Zero,
      );

      const batches = 5;
      const SMALL_AMOUNT = AMOUNT.div(batches);
      await Promise.all([...Array(batches)].map(_ => hardhat.run("swap", { defo: fromWei(SMALL_AMOUNT) })));
      expect(await defoContract.balanceOf(deployer)).to.be.equal(balance.sub(SMALL_AMOUNT.mul(batches)));
    });

    it("should not allow to sell DEFO cumulatively by small amounts if greater than rewards in total", async () => {
      await defoContract.mint(deployer, TEST_AMOUNT);
      await defoContract.deny(deployer);
      await hardhat.run("get-some-dai");
      await hardhat.run("permit");
      await hardhat.run("get-some-gems");
      await hardhat.run("jump-in-time");
      const AMOUNT = GEM_TYPES_CONFIG.reduce<BigNumber>(
        (totalReward, gemConfig) => totalReward.add(gemConfig.rewardAmountDefo as BigNumber),
        hardhat.ethers.constants.Zero,
      );
      const batches = 5;
      const SMALL_AMOUNT = AMOUNT.div(batches);
      await expect(Promise.all([...Array(batches + 1)].map(_ => hardhat.run("swap", { defo: fromWei(SMALL_AMOUNT) }))))
        .to.be.reverted;
    });

    it("should swap DEFO to DAI past three weeks if amount equal to three-weekly rewards", async () => {
      await defoContract.mint(deployer, TEST_AMOUNT);
      await defoContract.deny(deployer);
      await hardhat.run("get-some-dai");
      await hardhat.run("permit");
      await hardhat.run("get-some-gems");
      await hardhat.run("jump-in-time", { time: "3weeks" });
      const balance = await defoContract.balanceOf(deployer);
      const AMOUNT = GEM_TYPES_CONFIG.reduce<BigNumber>(
        (totalReward, gemConfig) => totalReward.add(gemConfig.rewardAmountDefo as BigNumber),
        hardhat.ethers.constants.Zero,
      ).mul(3);

      await hardhat.run("swap", { defo: fromWei(AMOUNT) });
      expect(await defoContract.balanceOf(deployer)).to.be.equal(balance.sub(AMOUNT));
    });

    it("should revert on swap DEFO to DAI if amount is more than weekly rewards", async () => {
      await defoContract.mint(deployer, TEST_AMOUNT.mul(2));
      await hardhat.run("get-some-dai");
      await hardhat.run("get-some-dai");
      await hardhat.run("permit");
      await hardhat.run("get-some-gems");
      await hardhat.run("jump-in-time");
      await defoContract.deny(deployer);
      await expect(hardhat.run("swap", { defo: fromWei(TEST_AMOUNT) })).to.be.reverted;
    });

    it("should revert past three weeks if amount greater than three-weekly rewards", async () => {
      await defoContract.mint(deployer, TEST_AMOUNT);
      await defoContract.deny(deployer);
      await hardhat.run("get-some-dai");
      await hardhat.run("permit");
      await hardhat.run("get-some-gems");
      await hardhat.run("jump-in-time", { time: "3weeks" });
      const AMOUNT = GEM_TYPES_CONFIG.reduce<BigNumber>(
        (totalReward, gemConfig) => totalReward.add(gemConfig.rewardAmountDefo as BigNumber),
        hardhat.ethers.constants.Zero,
      )
        .mul(3)
        .add(toWei(1));

      await expect(hardhat.run("swap", { defo: fromWei(AMOUNT) })).to.be.reverted;
    });

    it("should not on swap DEFO of any amount for authorized user", async () => {
      await defoContract.mint(deployer, TEST_AMOUNT.mul(2));
      await expect(hardhat.run("swap", { defo: fromWei(TEST_AMOUNT) })).not.to.be.reverted;
    });
  });
});
