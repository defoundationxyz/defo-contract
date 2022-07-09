import { DeployFunction } from "hardhat-deploy/types";

import { ERC721Facet, OwnerFacet } from "../../types";
import { deployAnnounce, deploySuccess } from "../../utils/helpers";

const func: DeployFunction = async hre => {
  const { getNamedAccounts, deployments } = hre;
  const { deployer, dai, treasury, reward, donations } = await getNamedAccounts();

  deployAnnounce("\n\nInitializing OwnerFacet and ERC721Facet with preconfigured account addresses...");

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

  const erc721FacetInstance = await hre.ethers.getContractAt<ERC721Facet>("ERC721Facet", diamondDeployment.address);
  await erc721FacetInstance.initialize("Defo Node", "DFN");
  deploySuccess("Success");
};

export default func;
func.tags = ["DiamondInitialize"];
