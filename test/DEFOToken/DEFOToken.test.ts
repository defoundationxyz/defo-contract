import { toWei } from "@config";
import { DEFOToken } from "@contractTypes/contracts/token";
import { getContractWithSigner } from "@utils/chain.helper";
import { expect } from "chai";
import hardhat, { deployments } from "hardhat";
import { Address } from "hardhat-deploy/dist/types";

describe("DEFOToken", () => {
  const TEST_AMOUNT = toWei(1000);
  let contract: DEFOToken;
  let defoTokenOwner: Address;
  let otherUser: Address;

  beforeEach(async () => {
    await deployments.fixture(["DEFOToken", "DEFODiamond", "DEFOTokenInit"]);
    contract = await getContractWithSigner<DEFOToken>(hardhat, "DEFOToken", "defoTokenOwner");
    defoTokenOwner = (await hardhat.getNamedAccounts()).defoTokenOwner;
    const ANY_NUMBER_NOT_0 = 3;
    otherUser = (await hardhat.ethers.getSigners())[ANY_NUMBER_NOT_0].address;
  });

  describe("mint()", () => {
    it("should mint DEFO tokens to defoTokenOwner", async () => {
      await contract.mint(defoTokenOwner, TEST_AMOUNT);
      expect(await contract.balanceOf(defoTokenOwner)).to.be.equal(TEST_AMOUNT);
    });
    it("should mint DEFO tokens to any address if called by authorized party", async () => {
      await contract.mint(otherUser, TEST_AMOUNT);
      expect(await contract.balanceOf(otherUser)).to.be.equal(TEST_AMOUNT);
    });
    it("should not mint DEFO tokens to unauthorized party", async () => {
      const contractFromOtherUser = await getContractWithSigner<DEFOToken>(hardhat, "DEFOToken", "donations");
      await expect(contractFromOtherUser.mint(otherUser, TEST_AMOUNT)).to.be.revertedWith("DEFOToken:not-authorized");
    });
  });

  describe("transferFrom()", () => {
    it("should transfer DEFO to another user any amount", async () => {
      await contract.mint(defoTokenOwner, TEST_AMOUNT);
      await contract.transfer(otherUser, TEST_AMOUNT);
      expect(await contract.balanceOf(otherUser)).to.be.equal(TEST_AMOUNT);
    });
    // it("should revert on transfer to liquidity pair if daily sale limit is reached", async () => {
    //   expect(false).eq(true);
    // });
    // it("should revert on transfer to liquidity pair if greater than daily rewards", async () => {
    //   expect(false).eq(true);
    // });
  });
});
