import { GEMS, PROTOCOL_CONFIG, gemName } from "@config";
import { MAINNET_DAI_ADDRESS } from "@constants/addresses";
import { ConfigFacet, MaintenanceFacet, YieldGemFacet } from "@contractTypes/contracts/facets";
import { DEFOToken } from "@contractTypes/contracts/token";
import { getContractWithSigner } from "@utils/chain.helper";
import ERC20ABI from "abi/erc20-abi.json";
import { expect } from "chai";
import newDebug from "debug";
import { Contract } from "ethers";
import hardhat, { deployments, ethers } from "hardhat";
import { Address } from "hardhat-deploy/dist/types";

const debug = newDebug("defo:MaintenanceFacet.test.ts");

describe("MaintenanceFacet", () => {
  let contract: YieldGemFacet & ConfigFacet & MaintenanceFacet;
  let paymentTokenContracts: [Contract, Contract];
  let namedAccounts: { [name: string]: Address };
  let user: Address;
  let otherUser: Address;

  beforeEach(async () => {
    await deployments.fixture(["DEFOToken", "DEFODiamond", "DEFOTokenInit", "DiamondInitialized"]);
    contract = await getContractWithSigner<YieldGemFacet & ConfigFacet & MaintenanceFacet>(hardhat, "DEFODiamond");
    const defoContract = await getContractWithSigner<DEFOToken>(hardhat, "DEFOToken");
    const daiContract = await ethers.getContractAt(ERC20ABI, MAINNET_DAI_ADDRESS);
    paymentTokenContracts = [daiContract, defoContract];
    namedAccounts = await hardhat.getNamedAccounts();
    user = namedAccounts.deployer;
    const ANY_NUMBER_NOT_0 = 3;
    otherUser = (await hardhat.ethers.getSigners())[ANY_NUMBER_NOT_0].address;
  });

  // ERC721 Compatibility Tests
  describe("maintain(tokenId)", () => {
    it("should pay maintenance fee for a gem", async () => {
      await hardhat.run("get-some-dai");
      await hardhat.run("get-some-defo");
      await hardhat.run("permit");
      await hardhat.run("get-some-gems");
      await hardhat.run("jump-in-time", { time: `${(<number>PROTOCOL_CONFIG.maintenancePeriod + 1).toString()}s` });
      for (const id of Object.values(GEMS)) {
        debug(`testing  gem type: ${gemName(id)}`);
        await expect(contract.maintain(id)).to.be.not.reverted;
      }
    });
  });
});
