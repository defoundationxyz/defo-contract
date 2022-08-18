import { GEM_TYPES_CONFIG, PROTOCOL_CONFIG } from "@config";
import { FUJI_DAI_ADDRESS, MAINNET_DAI_ADDRESS } from "@constants/addresses";
import { ConfigFacet, DEFOToken, ERC721Facet } from "@contractTypes/index";
import { getContractWithSigner, isFuji, namedSigner } from "@utils/chain.helper";
import { deployAnnounce, deployInfo, deploySuccess, sayMaximumForMaxUint } from "@utils/output.helper";
import DAI_ABI from "abi/erc20-abi.json";
import chalk from "chalk";
import { signDaiPermit } from "eth-permit";
import { DeployFunction } from "hardhat-deploy/types";

import JOE_FACTORY_ABI from "../abi/joe-factory.json";
import JOE_ROUTER_ABI from "../abi/joe-router.json";


const func: DeployFunction = async hre => {
  const { getNamedAccounts, deployments, ethers } = hre;
  const {
    deployer,
    dai: daiAddress,
    treasury,
    joeRouter,
    vault,
    rewardPool,
    donations,
    team,
  } = await getNamedAccounts();
  deployAnnounce("\n\nConfiguring the protocol...");

  const diamondDeployment = await deployments.get("DEFODiamond");
  const defoTokenDeployment = await deployments.get("DEFOToken");

  const daiContract = await ethers.getContractAt(DAI_ABI, daiAddress);
  const joeRouterContact = await ethers.getContractAt(JOE_ROUTER_ABI, joeRouter);
  const factoryAddress = await joeRouterContact.factory();
  const factoryContract = await ethers.getContractAt(JOE_FACTORY_ABI, factoryAddress);
  const pairAddress = factoryContract.getPair(daiContract.address, defoTokenDeployment.address);

  const paymentTokens: [string, string] = [
    (await isFuji(hre)) ? FUJI_DAI_ADDRESS : MAINNET_DAI_ADDRESS,
    defoTokenDeployment.address!,
  ];
  const wallets = [
    treasury,
    rewardPool,
    pairAddress,
    team,
    donations,
    vault,
    deployer, //redeem contract goes here
  ];

  const configFacetInstance = await ethers.getContract<ConfigFacet>("DEFODiamond");
  await configFacetInstance.setConfig({ paymentTokens, wallets, ...PROTOCOL_CONFIG });
  deployInfo("DEFODiamond configured.");

  deployAnnounce("\n\nConfiguring gem types...");
  await configFacetInstance.setGemTypesConfig(GEM_TYPES_CONFIG);
  deployInfo("Gem types configured.");

  for (const tokensOwner of ["treasury", "vault", "rewardPool", "donations"]) {
    deployAnnounce(`\nApproving Diamond to spend on behalf of ${chalk.yellow(tokensOwner)}`);
    const defoContract = await getContractWithSigner<DEFOToken>(hre, "DEFOToken", tokensOwner);
    const signer = await namedSigner(hre, tokensOwner);
    const daiContract = await ethers.getContractAt(DAI_ABI, daiAddress, signer);

    for (const token of [defoContract, daiContract]) {
      const name = await token.name();
      deployAnnounce(`🔑 Approving spending of ${name}...`);
      const initialAllowance = await token.allowance(signer.address, diamondDeployment.address);
      deployInfo(`Current allowance is ${sayMaximumForMaxUint(initialAllowance)}`);
      if (token == defoContract) {
        deployInfo(`Signing for ${name}`);
        const result = await signDaiPermit(ethers.provider, token.address, signer.address, diamondDeployment.address);
        await token.permit(
          signer.address,
          diamondDeployment.address,
          result.nonce,
          result.expiry,
          true,
          result.v,
          result.r,
          result.s,
        );
      } else {
        deployInfo(`Calling approve for ${await token.name()}, max amount`);
        await token.approve(diamondDeployment.address, ethers.constants.MaxUint256);
      }
      const allowance = await token.allowance(signer.address, diamondDeployment.address);
      deploySuccess(`Permission to spend granted.Allowance is ${sayMaximumForMaxUint(allowance)}`);
    }
  }

  const erc721FacetInstance = await ethers.getContractAt<ERC721Facet>("ERC721Facet", diamondDeployment.address);
  await erc721FacetInstance.initializeERC721Facet("DEFO Node", "DFN");
  deployInfo("DEFO Node configured.");

  deploySuccess("Success");
};

export default func;
func.tags = ["DiamondInitialized"];
