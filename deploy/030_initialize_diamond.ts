import { GEM_TYPES_CONFIG, PROTOCOL_CONFIG, Wallets } from "@config";
import { FUJI_DAI_ADDRESS, MAINNET_DAI_ADDRESS } from "@constants/addresses";
import { ConfigFacet, DEFOToken, ERC721Facet } from "@contractTypes/index";
import { getContractWithSigner, isFuji, namedSigner } from "@utils/chain.helper";
import {
  deployAnnounce,
  deployError,
  deployInfo,
  deploySuccess,
  deployWarning,
  sayMaximumForMaxUint,
} from "@utils/output.helper";
import DAI_ABI from "abi/erc20-abi.json";
import chalk from "chalk";
import { signDaiPermit } from "eth-permit";
import { BigNumber } from "ethers";
import { DeployFunction } from "hardhat-deploy/types";

import JOE_FACTORY_ABI from "../abi/joe-factory.json";
import JOE_ROUTER_ABI from "../abi/joe-router.json";

const func: DeployFunction = async hre => {
  const { getNamedAccounts, deployments, ethers } = hre;
  const {
    deployer,
    dai: daiAddress,
    treasury,
    dexRouter,
    vault,
    rewardPool,
    donations,
    team,
  } = await getNamedAccounts();
  deployAnnounce("\n\nConfiguring the protocol...");

  const diamondDeployment = await deployments.get("DEFODiamond");
  const defoTokenDeployment = await deployments.get("DEFOToken");

  const daiContract = await ethers.getContractAt(DAI_ABI, daiAddress);
  const dexRouterContact = await ethers.getContractAt(JOE_ROUTER_ABI, dexRouter);
  const factoryAddress = await dexRouterContact.factory();
  const factoryContract = await ethers.getContractAt(JOE_FACTORY_ABI, factoryAddress);
  let pairAddress = await factoryContract.getPair(daiContract.address, defoTokenDeployment.address);
  if (pairAddress === ethers.constants.AddressZero) {
    deployWarning("Liquidity Pair has not been created, generating an address, don't forget to fund!");
    await factoryContract.createPair(daiContract.address, defoTokenDeployment.address);
    pairAddress = await factoryContract.getPair(daiContract.address, defoTokenDeployment.address);
  }

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

  deployInfo("Configuration wallets:");
  const walletNames = Object.values(Wallets)
    .filter(i => isNaN(Number(i)))
    .map(i => i.toString().padEnd(15));
  wallets.forEach((wallet, index) => {
    if (wallet === ethers.constants.AddressZero) {
      deployError(wallet);
      throw new Error("Attempt to pass zero address to the configuration.");
    } else deployInfo(`${index.toString().padStart(2, "0")}: ${walletNames[index]} : ${chalk.green(wallet)}`);
  });

  const configFacetInstance = await ethers.getContract<ConfigFacet>("DEFODiamond");
  await (await configFacetInstance.setConfig({ paymentTokens, wallets, ...PROTOCOL_CONFIG })).wait();
  deployInfo("DEFODiamond configured.");

  deployAnnounce("\n\nConfiguring gem types...");
  await (await configFacetInstance.setGemTypesConfig(GEM_TYPES_CONFIG)).wait();
  deployInfo("Gem types configured.");

  for (const tokensOwner of ["treasury", "vault", "rewardPool", "donations"]) {
    deployAnnounce(`\nApproving Diamond to spend on behalf of ${chalk.yellow(tokensOwner)}`);
    const defoContract = await getContractWithSigner<DEFOToken>(hre, "DEFOToken", tokensOwner);
    const signer = await namedSigner(hre, tokensOwner);
    const daiContract = await ethers.getContractAt(DAI_ABI, daiAddress, signer);

    for (const token of [defoContract, daiContract]) {
      const name = await token.name();
      deployAnnounce(`🔑 Approving spending of ${name}...`);
      const initialAllowance: BigNumber = await token.allowance(signer.address, diamondDeployment.address);
      deployInfo(`Current allowance is ${sayMaximumForMaxUint(initialAllowance)}`);
      if (initialAllowance.eq(ethers.constants.MaxUint256)) {
        deploySuccess(`Skipping.`);
      } else {
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
  }

  const erc721FacetInstance = await ethers.getContractAt<ERC721Facet>("ERC721Facet", diamondDeployment.address);
  const initialized = await erc721FacetInstance.initialized();
  if (initialized) {
    const name = await erc721FacetInstance.name();
    const symbol = await erc721FacetInstance.symbol();
    deployInfo(`DEFO Node already configured: name ${name}, ticker: ${symbol}, skipping.`);
  } else {
    await erc721FacetInstance.initializeERC721Facet("DEFO Node", "DFN");
    deployInfo("DEFO Node configured.");
  }
  deploySuccess("Success");
};

export default func;
func.tags = ["DiamondInitialized"];
