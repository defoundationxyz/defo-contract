import { GEM_TYPES_CONFIG, PROTOCOL_CONFIG } from "@config";
import { MAINNET_DAI_ADDRESS } from "@constants/addresses";
import { ConfigFacet } from "@contractTypes/contracts/facets";
import { GemTypeConfigStruct, ProtocolConfigStruct } from "@contractTypes/contracts/interfaces/IConfig";
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
  let wallets: string[];

  beforeEach(async () => {
    await deployments.fixture(["DEFOToken", "DEFODiamond"]);
    contract = await getContractWithSigner<ConfigFacet>(hardhat, "DEFODiamond");
    const defoTokenDeploymentAddress = (await getContractWithSigner<DEFOToken>(hardhat, "DEFOToken")).address;
    paymentTokens = [MAINNET_DAI_ADDRESS, defoTokenDeploymentAddress];
    namedAccounts = await hardhat.getNamedAccounts();
    wallets = [
      namedAccounts.treasury,
      namedAccounts.rewardPool,
      namedAccounts.deployer, //liquidity pair goes here
      namedAccounts.stabilizer,
      namedAccounts.donations,
      namedAccounts.vault,
      namedAccounts.deployer, //redeem contract goes here
      namedAccounts.dexRouter,
    ];
  });

  describe("setConfig()", () => {
    it("should set configuration of the protocol", async () => {
      expect(await contract.setConfig({ paymentTokens, wallets, ...PROTOCOL_CONFIG }));
    });
  });

  describe("getConfig()", () => {
    it("should get the configuration from the contract, should equal to the one set", async () => {
      const etalonConfig = { paymentTokens, wallets, ...PROTOCOL_CONFIG };
      await contract.setConfig(etalonConfig);
      const config = await contract.getConfig();
      Object.keys(etalonConfig).forEach(key => {
        const index = key as keyof ProtocolConfigStruct;
        const etalon = etalonConfig[index];
        const toCompare = config[index];
        debug(`comparing ${key}`);
        if (typeof etalon === "object") {
          Object.keys(etalon).forEach(etalonKey =>
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            expect(etalon[etalonKey].toString().toUpperCase()).to.be.equal(
              // eslint-disable-next-line @typescript-eslint/ban-ts-comment
              // @ts-ignore
              toCompare[etalonKey].toString().toUpperCase(),
            ),
          );
        } else {
          expect(etalon.toString().toUpperCase()).to.be.equal(toCompare.toString().toUpperCase());
        }
      });
    });
  });

  describe("setGemTypesConfig()", () => {
    it("should set configuration of the gem type", async () => {
      expect(await contract.setGemTypesConfig(GEM_TYPES_CONFIG));
    });
  });

  describe("getGemTypesConfig()", () => {
    it("should get the configuration from the contract, should equal to the one set", async () => {
      await contract.setGemTypesConfig(GEM_TYPES_CONFIG);
      const config = await contract.getGemTypesConfig();
      for (const i in GEM_TYPES_CONFIG) {
        debug(`\nGem type ${i}`);
        Object.keys(GEM_TYPES_CONFIG[i]).forEach(key => {
          debug(`comparing ${key}`);
          expect(GEM_TYPES_CONFIG[i][key as keyof GemTypeConfigStruct].toString().toUpperCase()).to.be.equal(
            config[i][key as keyof GemTypeConfigStruct].toString().toUpperCase(),
          );
        });
      }
    });
  });
});
