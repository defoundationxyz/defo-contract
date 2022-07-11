import { deployAndTell } from "@utils/deployFunc";
import { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async hre => {
  const { getNamedAccounts, deployments } = hre;
  const { diamond } = deployments;
  const { deployer } = await getNamedAccounts();

  const facetNames = [
    "ERC721Facet",
    "ERC721EnumerableFacet",
    "GemFacet",
    "VaultStakingFacet",
    "GemGettersFacet",
    "OwnerFacet",
    "NodeLimiterFacet",
  ];
  /// TODO Check ERC721Enumerable since it has bad reputation for huge gas overhead
  await deployAndTell(diamond.deploy, "DEFODiamond", {
    from: deployer,
    owner: deployer,
    facets: facetNames,
  });
};

export default func;
func.tags = ["DEFODiamond"];
