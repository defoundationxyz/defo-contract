import {
  GEMS,
  GEM_TYPES_CONFIG,
  PERCENTAGE_PRECISION_MULTIPLIER,
  PROTOCOL_CONFIG,
  PaymentTokens,
  gemName,
} from "@config";
import { MAINNET_DAI_ADDRESS } from "@constants/addresses";
import { YieldGemFacet } from "@contractTypes/contracts/facets";
import { DEFOToken } from "@contractTypes/contracts/token";
import { getContractWithSigner } from "@utils/chain.helper";
import ERC20ABI from "abi/erc20-abi.json";
import { expect } from "chai";
import newDebug from "debug";
import { BigNumber, Contract } from "ethers";
import hardhat, { deployments, ethers } from "hardhat";
import { SignerWithAddress } from "hardhat-deploy-ethers/signers";
import { Address } from "hardhat-deploy/dist/types";


const debug = newDebug("defo:YieldGemFacet.test.ts");

describe("YieldGemFacet", () => {
  let contract: YieldGemFacet;
  let paymentTokenContracts: [Contract, Contract];
  let namedAccounts: { [name: string]: Address };
  let wallets: SignerWithAddress[];

  beforeEach(async () => {
    await deployments.fixture(["DEFOToken", "DEFODiamond", "DiamondInitialized"]);
    contract = await getContractWithSigner<YieldGemFacet>(hardhat, "DEFODiamond");
    const defoContract = await getContractWithSigner<DEFOToken>(hardhat, "DEFOToken");
    const daiContract = await ethers.getContractAt(ERC20ABI, MAINNET_DAI_ADDRESS);
    paymentTokenContracts = [daiContract, defoContract];
    namedAccounts = await hardhat.getNamedAccounts();
    wallets = await hardhat.ethers.getSigners();
  });

  describe("mint()", () => {
    it("should mint a gem of every configured type", async () => {
      await hardhat.run("fork:get-some-dai");
      await hardhat.run("get-some-defo");
      await hardhat.run("permit");
      for (const i of Object.values(GEMS)) {
        debug(`minting ${gemName(i)}`);
        expect(await contract.mint(i));
      }
    });

    it("should not mint a gem if not enough balance", async () => {
      for (const i of Object.values(GEMS)) {
        debug(`minting ${gemName(i)}`);
        await expect(contract.mint(i)).to.be.revertedWith("Insufficient balance");
      }
    });

    it("should charge the correct price in DAI and DEFO", async () => {
      await hardhat.run("fork:get-some-dai");
      await hardhat.run("get-some-defo");
      await hardhat.run("permit");

      for (const i of Object.values(GEMS)) {
        debug(`minting ${gemName(i)}`);
        const balanceBefore: [BigNumber, BigNumber] = [BigNumber.from(0), BigNumber.from(0)];
        for (const token of [0, 1]) {
          balanceBefore[token] = await paymentTokenContracts[token].balanceOf(namedAccounts.deployer);
        }
        await contract.mint(i);
        for (const token of [0, 1]) {
          debug(`Gem ${gemName(i)}, checking price ${PaymentTokens[token]}`);
          const balanceAfter = await paymentTokenContracts[token].balanceOf(namedAccounts.deployer);
          const priceCharged = balanceBefore[token].sub(balanceAfter);
          expect(priceCharged).to.be.equal(GEM_TYPES_CONFIG[i].price[token]);
        }
      }
    });

    it("should distribute DAI and DEFO amount correctly on mint", async () => {
      it("should mint a gem of every configured type", async () => {
        await hardhat.run("fork:get-some-dai");
        await hardhat.run("get-some-defo");
        await hardhat.run("permit");
        const receiversNumber = PROTOCOL_CONFIG.incomeDistributionOnMint.length;

        for (const i of Object.values(GEMS)) {
          debug(`minting ${gemName(i)}`);
          const balanceBefore: Array<[BigNumber, BigNumber]> = new Array(receiversNumber).fill([
            BigNumber.from(0),
            BigNumber.from(0),
          ]);
          for (const token of [0, 1]) {
            for (let wallet = 0; wallet < receiversNumber; wallet++) {
              balanceBefore[wallet][token] = await paymentTokenContracts[token].balanceOf(wallets[i].address);
              debug(`Balance before wallet ${wallet} token ${token}: ${balanceBefore[wallet][token]}`);
            }
          }
          await contract.mint(i);
          for (const token in Object.values(PaymentTokens) as number[]) {
            for (let wallet = 0; wallet < receiversNumber; wallet++) {
              debug(`Gem ${gemName(i)}, checking price ${PaymentTokens[token]} for wallet ${wallets[i].address}`);
              const balanceAfter = await paymentTokenContracts[token].balanceOf(wallets[i].address);
              const priceDistributedToReceiver = balanceBefore[wallet][token].sub(balanceAfter);
              debug(`priceDistributedToReceiver wallet ${wallet} token ${token}: ${priceDistributedToReceiver}`);
              expect(priceDistributedToReceiver).to.be.equal(
                BigNumber.from(PROTOCOL_CONFIG.incomeDistributionOnMint[token][wallet])
                  .mul(BigNumber.from(GEM_TYPES_CONFIG[i].price[token]))
                  .div(BigNumber.from(PERCENTAGE_PRECISION_MULTIPLIER)),
              );
            }
          }
        }
      });
    });
  });
});
