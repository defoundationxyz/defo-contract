import assert from "assert";
import chalk from "chalk";
import { signDaiPermit } from "eth-permit";
import { DeployFunction } from "hardhat-deploy/types";

import DAI_ABI from "../../abi/erc20-abi.json";
import { DEFOToken, ERC721Facet, OwnerFacet } from "../../types";
import { deployAnnounce, deployInfo, deploySuccess } from "../../utils/helpers";

const func: DeployFunction = async hre => {
  const { getNamedAccounts, deployments, ethers } = hre;
  const { deployer, dai, treasury, vault, reward, donations, team } = await getNamedAccounts();
  const [_deployerSigner, treasurySigner, donationsSigner, teamSigner, vaultSigner, rewardSigner, _defoSigner] =
    await ethers.getSigners();

  deployAnnounce(
    "\n\nInitializing OwnerFacet and ERC721Facet with preconfigured account addresses, and giving pemission to DEFO and DAI to spend on behalf of treasury and vault ...",
  );

  assert(
    treasury === treasurySigner.address &&
      vault === vaultSigner.address &&
      reward === rewardSigner.address &&
      donations === donationsSigner.address &&
      team === teamSigner.address &&
      chalk.red(
        "Configuration error, named accounts do not correspond to signers: check the order of the Hardhat accounts.",
      ),
  );

  const diamondDeployment = await deployments.get("DEFODiamond");
  const defoTokenDeployment = await deployments.get("DEFOToken");

  const ownerFacetInstance = await hre.ethers.getContractAt<OwnerFacet>("OwnerFacet", diamondDeployment.address);
  await ownerFacetInstance.initialize(
    deployer, /// TODO it's _redeemContract, shouldn't be the deployer probably
    defoTokenDeployment.address, //_defoToken
    dai, //_paymentToken
    treasury, //_treasury
    diamondDeployment.address, //_limiter ?
    reward, //_rewardPool
    donations, //_donatio
  );
  deployInfo("OwnerFacet initialized with preconfigured facet addresses.");

  for (const tokensOwner of [
    { name: "treasury facet", signer: treasurySigner },
    { name: "vault facet", signer: vaultSigner },
    { name: "reward facet", signer: rewardSigner },
    { name: "donations facet", signer: donationsSigner },
  ]) {
    deployAnnounce(`\nApproving Diamond to spend on behalf of ${chalk.yellow(tokensOwner.name)}`);
    const defoContract = (await ethers.getContractAt<DEFOToken>("DEFOToken", defoTokenDeployment.address)).connect(
      tokensOwner.signer,
    );
    const daiContract = (await ethers.getContractAt(DAI_ABI, dai)).connect(tokensOwner.signer);
    for (const token of [defoContract, daiContract]) {
      const name = await token.name();
      deployAnnounce(`Approving spending of ${name}`);
      deployInfo(
        `Current allowance is ${ethers.utils.formatEther(
          await token.allowance(tokensOwner.signer.address, diamondDeployment.address),
        )}`,
      );
      if (token == defoContract) {
        deployInfo(`Signing for ${await token.name()}`);
        const result = await signDaiPermit(
          ethers.provider,
          token.address,
          tokensOwner.signer.address,
          diamondDeployment.address,
        );
        await token.permit(
          tokensOwner.signer.address,
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
      const allowance = ethers.utils.formatEther(
        await token.allowance(tokensOwner.signer.address, diamondDeployment.address),
      );
      deploySuccess(`Permission to spend granted. Now allowance is ${allowance}`);
    }
  }

  const erc721FacetInstance = await ethers.getContractAt<ERC721Facet>("ERC721Facet", diamondDeployment.address);
  await erc721FacetInstance.initialize("DEFO Node", "DFN");

  deploySuccess("Success");
};

export default func;
func.tags = ["DiamondInitialize"];
