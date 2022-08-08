import { PROTOCOL_CONFIG } from "@config";
import { MAINNET_DAI_ADDRESS } from "@constants/addresses";
import { ConfigFacet } from "@contractTypes/contracts/facets";
import { DEFOToken } from "@contractTypes/contracts/token";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { getContractWithSigner, isLocalForkingMainnetEnvironment } from "@utils/chain.helper";
import newDebug from "debug";
import hardhat, { deployments, ethers } from "hardhat";
import { Address } from "hardhat-deploy/dist/types";
import isEqual from "lodash.isequal";


const debug = newDebug("defo:YieldGemFacet.test.ts");

const {
  utils: { parseEther: toWei },
  getContractAt,
} = ethers;

describe("YieldGemFacet", () => {
  let configFacetContract: ConfigFacet;
  let wallet: SignerWithAddress;
  let paymentTokens: [string, string];
  let namedAccounts: { [name: string]: Address };

  before(async () => {
    await deployments.fixture("DEFODiamond");
    configFacetContract = await getContractWithSigner<ConfigFacet>(hardhat, "DEFODiamond");
    const defoTokenDeploymentAddress = (await getContractWithSigner<DEFOToken>(hardhat, "DEFOToken")).address;
    paymentTokens = [MAINNET_DAI_ADDRESS, defoTokenDeploymentAddress];
    namedAccounts = await hardhat.getNamedAccounts();
  });

  describe(`setConfig()`, () => {
    let wallets: string[];
    beforeEach(async () => {
      await deployments.fixture("DEFODiamond");
      if (await isLocalForkingMainnetEnvironment(hardhat))
        configFacetContract = await getContractWithSigner<ConfigFacet>(hardhat, "DEFODiamond");
      wallets = (await isLocalForkingMainnetEnvironment(hardhat))
        ? [
            namedAccounts.treasury,
            namedAccounts.rewardPool,
            namedAccounts.deployer, //liquidity pair goes here
            namedAccounts.team,
            namedAccounts.donations,
            namedAccounts.vault,
            namedAccounts.deployer, //redeem contract goes here
          ]
        : [
            namedAccounts.deployer,
            namedAccounts.deployer,
            namedAccounts.deployer,
            namedAccounts.deployer,
            namedAccounts.deployer,
            namedAccounts.deployer,
          ];
    });

    it("should set configuration to the protocol", async () => {
      // await configFacetContract.setConfig({paymentTokens, wallets, ...PROTOCOL_CONFIG});
    });

    it("should get configuration from the contract", async () => {
      const config = await configFacetContract.getConfig();
      const etalonConfig = { paymentTokens, wallets, ...PROTOCOL_CONFIG };
      isEqual(config, etalonConfig);
    });
  });
});
