import { GEM_TYPES_CONFIG, PROTOCOL_CONFIG } from "@config";
import { MAINNET_DAI_ADDRESS } from "@constants/addresses";
import { getContractWithSigner, namedSigner } from "@utils/chain.helper";
import { deployAnnounce, deployInfo, deploySuccess } from "@utils/output.helper";
import assert from "assert";
import chalk from "chalk";
import { signDaiPermit } from "eth-permit";
import { DeployFunction } from "hardhat-deploy/types";

import DAI_ABI from "../../abi/erc20-abi.json";
import { namedAccountsIndex } from "../../hardhat.accounts";
import { ConfigFacet, DEFOToken, ERC721Facet } from "../../types";

const func: DeployFunction = async hre => {
  const {
    getNamedAccounts,
    deployments,
    ethers,
    ethers: {
      utils: { formatEther: fromWei },
    },
  } = hre;
  const { deployer, dai, treasury, vault, rewardPool, donations, team } = await getNamedAccounts();
  const signers = await ethers.getSigners();

  deployAnnounce(
    "\n\nInitializing OwnerFacet and ERC721Facet with preconfigured account addresses, and giving pemission to DEFO and DAI to spend on behalf of treasury and vault ...",
  );

  assert(
    treasury === signers[namedAccountsIndex.treasury as number].address &&
      vault === signers[namedAccountsIndex.vault as number].address &&
      rewardPool === signers[namedAccountsIndex.rewardPool as number].address &&
      donations === signers[namedAccountsIndex.donations as number].address &&
      team === signers[namedAccountsIndex.team as number].address,
    chalk.red(
      "Configuration error, named accounts do not correspond to signers: check the order of the Hardhat accounts.",
    ),
  );

  const diamondDeployment = await deployments.get("DEFODiamond");
  const defoTokenDeployment = await deployments.get("DEFOToken");
  // initializeERC721Facet

  PROTOCOL_CONFIG.paymentTokens = [MAINNET_DAI_ADDRESS, defoTokenDeployment.address];
  PROTOCOL_CONFIG.wallets = [
    treasury,
    rewardPool,
    diamondDeployment.address, //liquidity pair goes here
    team,
    donations,
    deployer, //redeem contract goes here
  ];

  const configFacetInstance = await ethers.getContractAt<ConfigFacet>("DEFODiamond", diamondDeployment.address);
  await configFacetInstance.setConfig(PROTOCOL_CONFIG);
  deployInfo("DEFODiamond configured.");

  await configFacetInstance.setGemTypesConfig(GEM_TYPES_CONFIG);
  deployInfo("Gem types configured.");

  for (const tokensOwner of ["treasury", "vault", "rewardPool", "donations"]) {
    deployAnnounce(`\nApproving Diamond to spend on behalf of ${chalk.yellow(tokensOwner)}`);
    const defoContract = await getContractWithSigner<DEFOToken>(hre, "DEFOToken", tokensOwner);
    const signer = await namedSigner(hre, tokensOwner);
    const daiContract = await ethers.getContractAt(DAI_ABI, dai, signer);
    for (const token of [defoContract, daiContract]) {
      const name = await token.name();
      deployAnnounce(`🔑 Approving spending of ${name}...`);
      deployInfo(`Current allowance is ${fromWei(await token.allowance(signer.address, diamondDeployment.address))}`);
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
      deploySuccess(
        `Permission to spend granted.Allowance is ${
          allowance.eq(ethers.constants.MaxUint256) ? chalk.magenta("Maximum") : fromWei(allowance)
        }`,
      );
    }
  }

  const erc721FacetInstance = await ethers.getContractAt<ERC721Facet>("ERC721Facet", diamondDeployment.address);
  await erc721FacetInstance.initializeERC721Facet("DEFO Node", "DFN");
  deployInfo("DEFO Node configured.");

  deploySuccess("Success");
};

export default func;
func.tags = ["DiamondInitialized"];
