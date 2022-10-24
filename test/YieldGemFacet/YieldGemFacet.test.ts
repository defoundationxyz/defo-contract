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
  let user: Address;
  let otherUser: Address;

  beforeEach(async () => {
    await deployments.fixture(["DEFOToken", "DEFODiamond", "DEFOTokenInit", "DiamondInitialized"]);
    contract = await getContractWithSigner<YieldGemFacet & ConfigFacet>(hardhat, "DEFODiamond");
    const defoContract = await getContractWithSigner<DEFOToken>(hardhat, "DEFOToken");
    const daiContract = await ethers.getContractAt(ERC20ABI, MAINNET_DAI_ADDRESS);
    paymentTokenContracts = [daiContract, defoContract];
    namedAccounts = await hardhat.getNamedAccounts();
    user = namedAccounts.deployer;
    const ANY_NUMBER_NOT_0 = 3;
    otherUser = (await hardhat.ethers.getSigners())[ANY_NUMBER_NOT_0].address;
  });

  // ERC721 Compatibility Tests
  describe("balanceOf(address _owner)", () => {
    it("should transfer a gem to any other user and emit event", async () => {
      await hardhat.run("get-some-dai");
      await hardhat.run("get-some-defo");
      await hardhat.run("permit");
      await hardhat.run("get-some-gems");
      expect(await contract.balanceOf(user)).to.be.equal(Object.values(GEMS).length);
    });
  });

  describe("name()", () => {
    it("should return correct name: DEFO Node", async () => {
      expect(await contract.name()).to.be.equal("DEFO Node");
    });
  });
  describe("symbol()", () => {
    it("should return correct DEFO Node symbol: DFN", async () => {
      expect(await contract.symbol()).to.be.equal("DFN");
    });
  });

  describe("ownerOf(uint256 _tokenId)", () => {
    it("should return correct owner", async () => {
      await hardhat.run("get-some-dai");
      await hardhat.run("get-some-defo");
      await hardhat.run("permit");
      await hardhat.run("get-some-gems");
      for (const i of Object.values(GEMS)) {
        debug(`checking ${gemName(i)}`);
        expect(await contract.ownerOf(i)).to.be.equal(user);
      }
    });

    it("should return correct owner after transfer", async () => {
      await hardhat.run("get-some-dai");
      await hardhat.run("get-some-defo");
      await hardhat.run("permit");
      await hardhat.run("get-some-gems");
      for (const i of Object.values(GEMS)) {
        debug(`checking ${gemName(i)}`);
        await contract["safeTransferFrom(address,address,uint256)"](user, otherUser, i);
        expect(await contract.ownerOf(i)).to.be.equal(otherUser);
      }
    });
  });

  describe("safeTransferFrom(address _from, address _to, uint256 _tokenId)", () => {
    it("should transfer a gem to another user and emit event", async () => {
      await hardhat.run("get-some-dai");
      await hardhat.run("get-some-defo");
      await hardhat.run("permit");
      await hardhat.run("get-some-gems");
      for (const i of Object.values(GEMS)) {
        debug(`transferring ${gemName(i)}`);
        await expect(contract["safeTransferFrom(address,address,uint256)"](user, otherUser, i))
          .to.emit(contract, "Transfer")
          .withArgs(user, otherUser, i);
      }
    });

    it("should update user balance on transfer both for the sender and receiver ", async () => {
      await hardhat.run("get-some-dai");
      await hardhat.run("get-some-defo");
      await hardhat.run("permit");
      await hardhat.run("get-some-gems");
      for (const i of Object.values(GEMS)) {
        debug(`transferring ${gemName(i)}`);
        await contract["safeTransferFrom(address,address,uint256)"](user, otherUser, i);
      }
      expect(await contract.balanceOf(user)).to.be.equal(ethers.constants.Zero);
      expect(await contract.balanceOf(otherUser)).to.be.equal(Object.values(GEMS).length);
    });
  });

  // DEFO Specificity

  describe("mint(uint8 _gemTypeId)", () => {
    it("should mint a gem of every configured type and emit Transfer event", async () => {
      await hardhat.run("get-some-dai");
      await hardhat.run("get-some-defo");
      await hardhat.run("permit");
      for (const i of Object.values(GEMS)) {
        debug(`minting ${gemName(i)}`);
        await expect(contract.mint(i))
          .to.emit(contract, "Transfer")
          .withArgs(ethers.constants.AddressZero, user, BigNumber.from(i));
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
      await hardhat.run("get-some-dai");
      await hardhat.run("get-some-defo");
      await hardhat.run("permit");

      for (const i of Object.values(GEMS)) {
        debug(`minting ${gemName(i)}`);
        const balanceBefore: [BigNumber, BigNumber] = [ethers.constants.Zero, ethers.constants.Zero];
        for (const token of [0, 1]) {
          balanceBefore[token] = await paymentTokenContracts[token].balanceOf(user);
        }
        await contract.mint(i);
        for (const token of [0, 1]) {
          debug(`gem ${gemName(i)}, checking price ${PaymentTokens[token]}`);
          const balanceAfter: BigNumber = await paymentTokenContracts[token].balanceOf(user);
          const priceCharged: BigNumber = balanceBefore[token].sub(balanceAfter);
          expect(priceCharged).to.be.equal(GEM_TYPES_CONFIG[i].price[token]);
        }
      }
    });

    it("should revert on mint attempt more than allowed by a mint window", async () => {
      await hardhat.run("get-some-dai");
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
      await hardhat.run("get-some-dai");
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
        await hardhat.run("get-some-dai");
        await hardhat.run("get-some-defo");
        await hardhat.run("permit");
        const receiversNumber = PROTOCOL_CONFIG.incomeDistributionOnMint[0].length;
        const wallets = (await contract.getConfig()).wallets.slice(0, receiversNumber);
        debug(`testing  ${gemName(gemTypeId)}`);
        const balanceBefore: Array<[BigNumber, BigNumber]> = await Promise.all(
          wallets.map(
            async wallet =>
              await Promise.all(
                [0, 1].map(async token => {
                  const element: BigNumber = await paymentTokenContracts[token].balanceOf(wallet);
                  debug(`balance before wallet ${wallet}, token ${["DAI", "DEFO"][token]}: ${fromWei(element)}`);
                  return element;
                }) as [Promise<BigNumber>, Promise<BigNumber>],
              ),
          ),
        );
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
        await hardhat.run("get-some-dai");
        await hardhat.run("get-some-defo");
        await hardhat.run("permit");
        for (const i of Object.values(GEMS)) {
          debug(`testing gem ${gemName(i)}`);
          await contract.createBooster(user, i, booster.id);
          await contract.mint(i);
          expect((await contract.getGemInfo(i)).booster).to.be.equal(booster.id);
        }
      });

      for (const i of Object.values(GEMS)) {
        const anotherType = (i + 1) % Object.values(GEMS).length;
        it(`should not mint a boosted gem for ${gemName(
          anotherType,
        )} if there's a booster created for gem type  ${gemName(i)}`, async () => {
          await hardhat.run("get-some-dai");
          await hardhat.run("get-some-defo");
          await hardhat.run("permit");
          await contract.createBooster(user, i, booster.id);
          await contract.mint(anotherType);
          const boosterOfMintedGem = (await contract.getGemInfo(i)).booster;
          expect(boosterOfMintedGem).to.be.equal(0);
        });
      }
    });
  });

  for (const gemType of Object.values(GEMS)) {
    it(`should mint several different boosted gems for the same gem types if different boosters created`, async () => {
      await hardhat.run("get-some-dai");
      await hardhat.run("get-some-defo");
      await hardhat.run("permit");
      debug(`testing gem ${gemName(gemType)}`);
      await contract.createBooster(user, gemType, 1);
      await contract.createBooster(user, gemType, 2);
      await contract.mint(gemType);
      expect((await contract.getGemInfo(0)).booster).to.be.equal(2);
      await hardhat.run("jump-in-time");
      await contract.mint(gemType);
      expect((await contract.getGemInfo(1)).booster).to.be.equal(1);
      await hardhat.run("jump-in-time");
      await contract.mint(gemType);
      expect((await contract.getGemInfo(2)).booster).to.be.equal(0);
    });
  }

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
        expect(await contract.createBooster(user, 0, booster.id))),
    );
  });

  describe("getMintWindow(uint8 _gemTypeId)", () => {
    it("should return correct mint window initial details", async () => {
      await hardhat.run("get-some-dai");
      await hardhat.run("get-some-defo");
      await hardhat.run("permit");
      for (const gemId of Object.values(GEMS)) {
        const mintWindow = await contract.getMintWindow(gemId);
        expect(mintWindow.mintCount).to.be.equal(ethers.constants.Zero);
        const variance = mintWindow.endOfMintLimitWindow - (await ethers.provider.getBlock("latest")).timestamp;
        const error = <number>PROTOCOL_CONFIG.mintLimitWindow - variance;
        //endOfMintLimitWindow should be equa l to the block.timestamp + 12h, although some 10s difference is fine
        debug(`delay in s: ${error.toString()}`);
        expect(error).to.be.lessThan(100);
      }
    });

    it("should return correct mintCount", async () => {
      await hardhat.run("get-some-dai");
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
      await hardhat.run("get-some-dai");
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
      await hardhat.run("get-some-dai");
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
      await hardhat.run("get-some-dai");
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
});
