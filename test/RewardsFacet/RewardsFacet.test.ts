import { GEMS, GEM_TYPES_CONFIG, gemName } from "@config";
import { MAINNET_DAI_ADDRESS } from "@constants/addresses";
import { RewardsFacet } from "@contractTypes/contracts/facets";
import { DEFOToken } from "@contractTypes/contracts/token";
import { getContractWithSigner } from "@utils/chain.helper";
import { expect } from "chai";
import newDebug from "debug";
import hardhat, { deployments } from "hardhat";
import { Address } from "hardhat-deploy/dist/types";


const debug = newDebug("defo:YieldGemFacet.test.ts");

describe("RewardsFacet", () => {
  let contract: RewardsFacet;
  let paymentTokens: [string, string];
  let namedAccounts: { [name: string]: Address };
  let wallets: string[];

  beforeEach(async () => {
    await deployments.fixture(["DEFOToken", "DEFODiamond", "DEFOTokenInit", "DiamondInitialized"]);
    contract = await getContractWithSigner<RewardsFacet>(hardhat, "DEFODiamond");
    const defoTokenDeploymentAddress = (await getContractWithSigner<DEFOToken>(hardhat, "DEFOToken")).address;
    paymentTokens = [MAINNET_DAI_ADDRESS, defoTokenDeploymentAddress];
    namedAccounts = await hardhat.getNamedAccounts();
    wallets = [
      namedAccounts.treasury,
      namedAccounts.rewardPool,
      namedAccounts.deployer, //liquidity pair goes here
      namedAccounts.team,
      namedAccounts.donations,
      namedAccounts.vault,
      namedAccounts.deployer, //redeem contract goes here
    ];
  });

  describe("getRewardAmount(uint256 _tokenId)", () => {
    it("should earn reward with a given amount after one week", async () => {
      await hardhat.run("fork:get-some-dai");
      await hardhat.run("get-some-defo");
      await hardhat.run("permit");
      await hardhat.run("get-some-gems");
      await hardhat.run("jump-in-time");
      for (const i of Object.values(GEMS)) {
        debug(`getting reward amount of gem type ${gemName(i)}`);
        expect(await contract.getRewardAmount(i)).to.be.equal(GEM_TYPES_CONFIG[i].rewardAmountDefo);
      }
    });
  });

  describe("claimReward(uint256 _tokenId)", () => {
    it("should claim reward for every configured type", async () => {
      await hardhat.run("fork:get-some-dai");
      await hardhat.run("get-some-defo");
      await hardhat.run("permit");
      await hardhat.run("get-some-gems");
      await hardhat.run("jump-in-time");
      for (const i of Object.values(GEMS)) {
        debug(`claiming gem type ${gemName(i)}`);
        expect(await contract.claimReward(i));
      }
    });
  });
});
