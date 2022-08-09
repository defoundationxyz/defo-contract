import { PROTOCOL_CONFIG } from "@config";
import { MAINNET_DAI_ADDRESS } from "@constants/addresses";
import { ConfigFacet } from "@contractTypes/contracts/facets";
import { ProtocolConfigStruct } from "@contractTypes/contracts/interfaces/IConfig";
import { DEFOToken } from "@contractTypes/contracts/token";
import { getContractWithSigner } from "@utils/chain.helper";
import { expect } from "chai";
import newDebug from "debug";
import hardhat, { deployments } from "hardhat";
import { Address } from "hardhat-deploy/dist/types";


const debug = newDebug("defo:Config.test.ts");

describe("ConfigFacet", () => {
  let contract: ConfigFacet;
  let paymentTokens: [string, string];
  let namedAccounts: { [name: string]: Address };

  before(async () => {
    await deployments.fixture(["DEFOToken", "DEFODiamond"]);
    contract = await getContractWithSigner<ConfigFacet>(hardhat, "DEFODiamond");
    const defoTokenDeploymentAddress = (await getContractWithSigner<DEFOToken>(hardhat, "DEFOToken")).address;
    paymentTokens = [MAINNET_DAI_ADDRESS, defoTokenDeploymentAddress];
    namedAccounts = await hardhat.getNamedAccounts();
  });

  describe("setConfig()", () => {
    let wallets: string[];
    beforeEach(async () => {
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
    it("should set configuration to the protocol", async () => {
      expect(await contract.setConfig({ paymentTokens, wallets, ...PROTOCOL_CONFIG }));
    });

    it("should get the configuration from the contract, should equal to the one set", async () => {
      const etalonConfig = { paymentTokens, wallets, ...PROTOCOL_CONFIG };
      await contract.setConfig(etalonConfig);
      const config = await contract.getConfig();
      Object.keys(etalonConfig).forEach(key => {
        const index = key as keyof ProtocolConfigStruct;
        const etalon = etalonConfig[index];
        const toCompare = config[index];
        debug(`comparing ${key}`);
        expect(etalon.toString().toUpperCase()).to.be.equal(toCompare.toString().toUpperCase());
      });
    });
  });
});
