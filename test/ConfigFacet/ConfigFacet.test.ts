// import { PROTOCOL_CONFIG } from "@config";
// import {
//   FUJI_DAI_ADDRESS,
//   FUJI_DEFO_ADDRESS,
//   FUJI_DEPLOYED_DIAMOND_ADDRESS,
//   MAINNET_DAI_ADDRESS,
//   MAINNET_DEFO_ADDRESS,
//   MAINNET_DEPLOYED_DIAMOND_ADDRESS,
// } from "@constants/addresses";
// import { ConfigFacet } from "@contractTypes/contracts/facets";
// import { DEFOToken } from "@contractTypes/contracts/token";
// import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
// import { getContractWithSigner, isFuji, isLocalForkingMainnetEnvironment } from "@utils/chain.helper";
// import newDebug from "debug";
// import hardhat, { deployments, ethers } from "hardhat";
// import { Address } from "hardhat-deploy/dist/types";
// import isEqual from "lodash.isequal";
//
// const debug = newDebug("defo:ConfigFacet.test.ts");
//
// const {
//   utils: { parseEther: toWei },
//   getContractAt,
// } = ethers;
//
// describe("ConfigFacet", () => {
//   let configFacetContract: ConfigFacet;
//   let wallet: SignerWithAddress;
//   let paymentTokens: [string, string];
//   let namedAccounts: { [name: string]: Address };
//
//   before(async () => {
//     let defoTokenDeploymentAddress: string;
//     if (await isLocalForkingMainnetEnvironment(hardhat)) {
//       await deployments.fixture("DEFODiamond");
//       configFacetContract = await getContractWithSigner<ConfigFacet>(hardhat, "DEFODiamond");
//       defoTokenDeploymentAddress = (await getContractWithSigner<DEFOToken>(hardhat, "DEFOToken")).address;
//     } else {
//       configFacetContract ??= await getContractAt<ConfigFacet>(
//         "DEFODiamond",
//         (await isFuji(hardhat)) ? FUJI_DEPLOYED_DIAMOND_ADDRESS : MAINNET_DEPLOYED_DIAMOND_ADDRESS,
//       );
//       defoTokenDeploymentAddress ??= (await isFuji(hardhat)) ? FUJI_DEFO_ADDRESS : MAINNET_DEFO_ADDRESS;
//     }
//     paymentTokens = [(await isFuji(hardhat)) ? FUJI_DAI_ADDRESS : MAINNET_DAI_ADDRESS, defoTokenDeploymentAddress];
//     namedAccounts = await hardhat.getNamedAccounts();
//   });
//
//   describe(`setConfig()`, () => {
//     let wallets: string[];
//     beforeEach(async () => {
//       await deployments.fixture("DEFODiamond");
//       if (await isLocalForkingMainnetEnvironment(hardhat))
//         configFacetContract = await getContractWithSigner<ConfigFacet>(hardhat, "DEFODiamond");
//       wallets = (await isLocalForkingMainnetEnvironment(hardhat))
//         ? [
//             namedAccounts.treasury,
//             namedAccounts.rewardPool,
//             namedAccounts.deployer, //liquidity pair goes here
//             namedAccounts.team,
//             namedAccounts.donations,
//             namedAccounts.vault,
//             namedAccounts.deployer, //redeem contract goes here
//           ]
//         : [
//             namedAccounts.deployer,
//             namedAccounts.deployer,
//             namedAccounts.deployer,
//             namedAccounts.deployer,
//             namedAccounts.deployer,
//             namedAccounts.deployer,
//           ];
//     });
//
//     it("should set configuration to the protocol", async () => {
//       // await configFacetContract.setConfig({paymentTokens, wallets, ...PROTOCOL_CONFIG});
//     });
//
//     it("should get configuration from the contract", async () => {
//       const config = await configFacetContract.getConfig();
//       const etalonConfig = { paymentTokens, wallets, ...PROTOCOL_CONFIG };
//       isEqual(config, etalonConfig);
//     });
//   });
// });
