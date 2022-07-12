import { DEFO_TOKEN_REWARD_POOL, DEFO_TOKEN_TREASURY } from "@config";
import { DEFOToken } from "@contractTypes/contracts";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { getContractWithSigner } from "@utils/chain.helper";
import { expect } from "chai";
import { ContractTransaction } from "ethers";
import hardhat, { deployments, ethers, getNamedAccounts } from "hardhat";
import { Address } from "hardhat-deploy/dist/types";

describe("DEFO Token", async () => {
  const decimals = 18;
  const supply = 1e6;
  const name = "DEFO Token";
  const ticker = "DEFO";
  let defoContract: DEFOToken;

  before(async () => {
    await deployments.fixture("DEFOToken");
    defoContract = await getContractWithSigner<DEFOToken>(hardhat, "DEFOToken", "defoTokenOwner");
  });

  describe("contract public data", () => {
    it("should return correct token name and symbol", async () => {
      expect(await defoContract.name()).to.equal(name);
      expect(await defoContract.symbol()).to.equal(ticker);
    });
    it("should return correct decimals", async () => {
      expect(await defoContract.decimals()).to.equal(decimals);
    });
    it("should return correct total supply", async () => {
      expect((await defoContract.totalSupply()).eq(ethers.utils.parseEther(supply.toString()))).to.be.true;
    });
  });

  describe("token distribution", () => {
    type AccountsToTest = "rewardPool" | "treasury";
    let accounts: { [name in AccountsToTest]: Address };

    before(async () => {
      accounts = <Pick<Record<string, Address>, AccountsToTest>>await getNamedAccounts();
    });

    it("should return correct reward pool balance", async () => {
      const balance = await defoContract.balanceOf(accounts.rewardPool);
      expect(balance.eq(ethers.utils.parseEther(DEFO_TOKEN_REWARD_POOL.toString()))).is.true;
    });

    it("should return correct treasury balance", async () => {
      const balance = await defoContract.balanceOf(accounts.treasury);
      expect(balance.eq(ethers.utils.parseEther(DEFO_TOKEN_TREASURY.toString()))).is.true;
    });
  });

  describe("owner()", () => {
    it("should return correct token owner", async () => {
      expect(await defoContract.owner()).to.equal(process.env.DEFO_TOKEN_PUBLIC_KEY);
    });
  });

  describe("transferOwnership()", () => {
    let anotherOwner: SignerWithAddress;
    let firstOwnerAddress: Address;
    let transferBack: () => Promise<ContractTransaction>;

    before(async () => {
      firstOwnerAddress = await defoContract.owner();
      anotherOwner = (await ethers.getSigners())[3];
      transferBack = () => defoContract.transferOwnership(firstOwnerAddress);
      await defoContract.transferOwnership(anotherOwner.address);
    });

    it("should return new owner", async () => {
      expect(await defoContract.owner()).to.equal(anotherOwner.address);
    });

    it("should deny authorization for previous owner", async () => {
      await expect(transferBack()).to.be.revertedWith("DEFO/not-authorized");
    });
  });
});
