import { GEMS, GEM_TYPES_CONFIG, HUNDRED_PERCENT, PROTOCOL_CONFIG, PaymentTokens, fromWei, gemName } from "@config";
import { MAINNET_DAI_ADDRESS } from "@constants/addresses";
import { ConfigFacet, YieldGemFacet } from "@contractTypes/contracts/facets";
import { DEFOToken } from "@contractTypes/contracts/token";
import { getContractWithSigner } from "@utils/chain.helper";
import ERC20ABI from "abi/erc20-abi.json";
import { expect } from "chai";
import newDebug from "debug";
import { BigNumber, Contract } from "ethers";
import hardhat, { deployments, ethers } from "hardhat";
import { Address } from "hardhat-deploy/dist/types";

import { BOOSTERS } from "../testHelpers";


const debug = newDebug("defo:YieldGemFacet.test.ts");
describe("YieldGemFacet", () => {
  let contract: YieldGemFacet & ConfigFacet;
  let paymentTokenContracts: [Contract, Contract];
  let namedAccounts: { [name: string]: Address };
  let otherUser: Address;

  beforeEach(async () => {
    await deployments.fixture(["DEFOToken", "DEFODiamond", "DEFOTokenInit", "DiamondInitialized"]);
    contract = await getContractWithSigner<YieldGemFacet & ConfigFacet>(hardhat, "DEFODiamond");
    const defoContract = await getContractWithSigner<DEFOToken>(hardhat, "DEFOToken");
    const daiContract = await ethers.getContractAt(ERC20ABI, MAINNET_DAI_ADDRESS);
    paymentTokenContracts = [daiContract, defoContract];
    namedAccounts = await hardhat.getNamedAccounts();
    const ANY_NUMBER_NOT_0 = 3;
    otherUser = (await hardhat.ethers.getSigners())[ANY_NUMBER_NOT_0].address;
  });

  describe("mint(uint8 _gemTypeId)", () => {
    it("should mint a gem of every configured type and emit Transfer event", async () => {
      await hardhat.run("dev:get-some-dai");
      await hardhat.run("get-some-defo");
      await hardhat.run("permit");
      for (const i of Object.values(GEMS)) {
        debug(`minting ${gemName(i)}`);
        await expect(contract.mint(i))
          .to.emit(contract, "Transfer")
          .withArgs(ethers.constants.AddressZero, namedAccounts.deployer, BigNumber.from(i));
      }
    });

    it("should revert on mint if not enough balance", async () => {
      await hardhat.run("permit");
      for (const i of Object.values(GEMS)) {
        debug(`attempting ${gemName(i)} with no balance`);
        await expect(contract.mint(i)).to.be.revertedWith("Insufficient balance");
      }
    });

    it("should charge the correct price in DAI and DEFO on mint", async () => {
      await hardhat.run("dev:get-some-dai");
      await hardhat.run("get-some-defo");
      await hardhat.run("permit");

      for (const i of Object.values(GEMS)) {
        debug(`minting ${gemName(i)}`);
        const balanceBefore: [BigNumber, BigNumber] = [ethers.constants.Zero, ethers.constants.Zero];
        for (const token of [0, 1]) {
          balanceBefore[token] = await paymentTokenContracts[token].balanceOf(namedAccounts.deployer);
        }
        await contract.mint(i);
        for (const token of [0, 1]) {
          debug(`gem ${gemName(i)}, checking price ${PaymentTokens[token]}`);
          const balanceAfter: BigNumber = await paymentTokenContracts[token].balanceOf(namedAccounts.deployer);
          const priceCharged: BigNumber = balanceBefore[token].sub(balanceAfter);
          expect(priceCharged).to.be.equal(GEM_TYPES_CONFIG[i].price[token]);
        }
      }
    });

    it("should revert on mint attempt more than allowed by a mint window", async () => {
      await hardhat.run("dev:get-some-dai");
      await hardhat.run("get-some-defo");
      await hardhat.run("permit");

      for (const i of Object.values(GEMS)) {
        debug(`testing ${gemName(i)}`);
        for (let mintNum = 0; mintNum < GEM_TYPES_CONFIG[i].maxMintsPerLimitWindow; mintNum++) {
          await contract.mint(i);
        }
        await expect(contract.mint(i)).to.be.revertedWith("Gem mint restriction");
      }
    });

    it("should mint during the next mint window when current window limit is reached", async () => {
      await hardhat.run("dev:get-some-dai");
      await hardhat.run("get-some-defo");
      await hardhat.run("permit");

      for (const i of Object.values(GEMS)) {
        for (let mintNum = 0; mintNum < GEM_TYPES_CONFIG[i].maxMintsPerLimitWindow; mintNum++) {
          await contract.mint(i);
        }
        debug(
          `minted ${GEM_TYPES_CONFIG[i].maxMintsPerLimitWindow} ${gemName(i)} gems, jumping to the next mint window`,
        );
        await hardhat.run("jump-in-time", { time: `${<number>PROTOCOL_CONFIG.mintLimitWindow}seconds` });
        expect(await contract.mint(i));
      }
    });

    for (const gemTypeId of Object.values(GEMS)) {
      it(`should distribute DAI and DEFO amount correctly on mint for gem ${gemName(gemTypeId)}`, async () => {
        await hardhat.run("dev:get-some-dai");
        await hardhat.run("get-some-defo");
        await hardhat.run("permit");
        const receiversNumber = PROTOCOL_CONFIG.incomeDistributionOnMint[0].length;
        const wallets = (await contract.getConfig()).wallets;
        ///todo check this test if it's running correctly

        debug(`minting ${gemName(gemTypeId)}`);
        const balanceBefore = new Array(receiversNumber).fill([ethers.constants.Zero, ethers.constants.Zero]);
        for (const token of [0, 1]) {
          for (let wallet = 0; wallet < receiversNumber; wallet++) {
            balanceBefore[wallet][token] = await paymentTokenContracts[token].balanceOf(wallets[wallet]);
            debug(
              `balance before wallet ${wallet}, ${wallets[wallet]}, token ${["DAI", "DEFO"][token]}: ${fromWei(
                balanceBefore[wallet][token],
              )}`,
            );
          }
        }
        debug(`balanceBefore ${balanceBefore.toString()}`);
        await contract.mint(gemTypeId);
        debug(`${gemName(gemTypeId)} minted`);
        for (const token of [0, 1]) {
          for (let wallet = 0; wallet < receiversNumber; wallet++) {
            const balanceAfter: BigNumber = await paymentTokenContracts[token].balanceOf(wallets[wallet]);
            debug(
              `balance after  wallet ${wallet}, ${wallets[wallet]}, token ${["DAI", "DEFO"][token]}: ${fromWei(
                balanceAfter,
              )}`,
            );
            const priceDistributedToReceiver: BigNumber = balanceAfter.sub(balanceBefore[wallet][token]);
            debug(
              `wallet ${wallet} ${wallets[wallet]} change is ${fromWei(priceDistributedToReceiver)} ${
                ["DAI", "DEFO"][token]
              }`,
            );
            expect(priceDistributedToReceiver).to.be.equal(
              BigNumber.from(PROTOCOL_CONFIG.incomeDistributionOnMint[token][wallet])
                .mul(BigNumber.from(GEM_TYPES_CONFIG[gemTypeId].price[token]))
                .div(BigNumber.from(HUNDRED_PERCENT)),
            );
          }
        }
      });
    }

    BOOSTERS.forEach(booster => {
      it(`should mint a boosted gem if there's a booster ${booster.name} created`, async () => {
        await hardhat.run("dev:get-some-dai");
        await hardhat.run("get-some-defo");
        await hardhat.run("permit");
        for (const i of Object.values(GEMS)) {
          debug(`testing gem ${gemName(i)}`);
          await contract.createBooster(namedAccounts.deployer, i, booster.id);
          await contract.mint(i);
          expect((await contract.getGemInfo(i)).booster).to.be.equal(booster.id);
        }
      });

      it("should not mint a boosted gem if there's a booster created for another gem type", async () => {
        await hardhat.run("dev:get-some-dai");
        await hardhat.run("get-some-defo");
        await hardhat.run("permit");
        for (const i of Object.values(GEMS)) {
          debug(`testing gem ${gemName(i)}`);
          await contract.createBooster(namedAccounts.deployer, i, booster.id);
          await contract.mint((i + 1) % Object.values(GEMS).length);
          expect((await contract.getGemInfo(i)).booster).to.be.equal(0);
        }
      });
    });
  });

  describe("mintTo(uint8 _gemType, address _to, Booster _booster)", () => {
    [0, 1, 2].forEach(boosterId =>
      it(`should mint a gem of every type with a booster ${
        ["None", "Delta", "Omega"][boosterId]
      } and emit Transfer event`, async () => {
        for (const i of Object.values(GEMS)) {
          debug(`minting ${gemName(i)}, ${["None", "Delta", "Omega"][boosterId]} booster`);
          await expect(contract.mintTo(i, otherUser, boosterId))
            .to.emit(contract, "Transfer")
            .withArgs(ethers.constants.AddressZero, otherUser, BigNumber.from(i));
        }
      }),
    );
    it("should revert if unauthorized ", async () => {
      const anyUser = "defoTokenOwner";
      const unauthorizedUserContract = await getContractWithSigner<YieldGemFacet>(hardhat, "DEFODiamond", anyUser);
      await expect(unauthorizedUserContract.mintTo(0, otherUser, 0)).to.be.revertedWith("Unauthorized");
    });
  });

  describe("createBooster(address _to, uint8 _gemType, Booster _booster)", () => {
    BOOSTERS.forEach(booster =>
      it(`should create a booster for a gem type, booster ${booster.name}`, async () =>
        expect(await contract.createBooster(namedAccounts.deployer, 0, booster.id))),
    );
  });

  describe("getMintWindow(uint8 _gemTypeId)", () => {
    it("should return correct mint window initial details", async () => {
      await hardhat.run("dev:get-some-dai");
      await hardhat.run("get-some-defo");
      await hardhat.run("permit");
      for (const gemId of Object.values(GEMS)) {
        const mintWindow = await contract.getMintWindow(gemId);
        expect(mintWindow.mintCount).to.be.equal(ethers.constants.Zero);
        const variance = mintWindow.endOfMintLimitWindow - (await ethers.provider.getBlock("latest")).timestamp;
        const error = <number>PROTOCOL_CONFIG.mintLimitWindow - variance;
        //endOfMintLimitWindow should be equal to the block.timestamp + 12h, although some 10s difference is fine
        debug(`delay in s: ${error.toString()}`);
        expect(error).to.be.lessThan(30);
      }
    });

    it("should return correct mintCount", async () => {
      await hardhat.run("dev:get-some-dai");
      await hardhat.run("get-some-defo");
      await hardhat.run("permit");
      for (const i of Object.values(GEMS)) {
        for (let mintNum = 0; mintNum < GEM_TYPES_CONFIG[i].maxMintsPerLimitWindow; mintNum++) {
          await contract.mint(i);
          const mintWindow = await contract.getMintWindow(i);
          expect(mintWindow.mintCount).to.be.equal(mintNum + 1);
        }
        debug(`minted ${GEM_TYPES_CONFIG[i].maxMintsPerLimitWindow} ${gemName(i)} gems`);
      }
    });

    it("should return zero mintCount if minted past the mintWindow", async () => {
      await hardhat.run("dev:get-some-dai");
      await hardhat.run("get-some-defo");
      await hardhat.run("permit");
      for (const i of Object.values(GEMS)) {
        debug(`testing gem ${gemName(i)}`);
        for (let mintNum = 0; mintNum < GEM_TYPES_CONFIG[i].maxMintsPerLimitWindow; mintNum++) {
          await contract.mint(i);
        }
        await hardhat.run("jump-in-time", { time: `${<number>PROTOCOL_CONFIG.mintLimitWindow}seconds` });
        expect((await contract.getMintWindow(i)).mintCount).to.be.equal(ethers.constants.Zero);
      }
    });

    it("should return zero mintCount if minted second time much later than mintWindow length", async () => {
      await hardhat.run("dev:get-some-dai");
      await hardhat.run("get-some-defo");
      await hardhat.run("permit");
      for (const i of Object.values(GEMS)) {
        debug(`testing gem ${gemName(i)}`);
        for (let mintNum = 0; mintNum < GEM_TYPES_CONFIG[i].maxMintsPerLimitWindow; mintNum++) {
          await contract.mint(i);
        }
        await hardhat.run("jump-in-time", { time: `${<number>PROTOCOL_CONFIG.mintLimitWindow * 5 + 1000}seconds` });
        expect((await contract.getMintWindow(i)).mintCount).to.be.equal(ethers.constants.Zero);
      }
    });

    it("should start counting mints in the next mintWindow", async () => {
      await hardhat.run("dev:get-some-dai");
      await hardhat.run("get-some-defo");
      await hardhat.run("permit");
      for (const i of Object.values(GEMS)) {
        debug(`testing gem ${gemName(i)}`);
        for (let mintNum = 0; mintNum < GEM_TYPES_CONFIG[i].maxMintsPerLimitWindow; mintNum++) {
          await contract.mint(i);
        }
        await hardhat.run("jump-in-time", { time: `${<number>PROTOCOL_CONFIG.mintLimitWindow}seconds` });
        for (let mintNum = 0; mintNum < GEM_TYPES_CONFIG[i].maxMintsPerLimitWindow; mintNum++) {
          await contract.mint(i);
          const mintWindow = await contract.getMintWindow(i);
          expect(mintWindow.mintCount).to.be.equal(mintNum + 1);
        }
        debug(`minted ${GEM_TYPES_CONFIG[i].maxMintsPerLimitWindow} ${gemName(i)} gems`);
      }
    });
  });

  describe("safeTransferFrom(address _from, address _to, uint256 _tokenId)", () => {
    it("should transfer a gem to any other user", async () => {
      await hardhat.run("dev:get-some-dai");
      await hardhat.run("get-some-defo");
      await hardhat.run("permit");
      await hardhat.run("get-some-gems");
      for (const i of Object.values(GEMS)) {
        debug(`transferring ${gemName(i)}`);
        await expect(contract["safeTransferFrom(address,address,uint256)"](namedAccounts.deployer, otherUser, i))
          .to.emit(contract, "Transfer")
          .withArgs(namedAccounts.deployer, otherUser, i);
      }
    });
  });
});
