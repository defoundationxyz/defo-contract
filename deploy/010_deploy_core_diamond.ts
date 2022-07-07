import { DeployFunction } from "hardhat-deploy/types";

import { deployAndTell } from "../utils/deployFunc";

const func: DeployFunction = async hre => {
  const {
    getNamedAccounts,
    deployments: { diamond },
  } = hre;
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

  await deployAndTell(diamond.deploy, "DEFODiamond", {
    from: deployer,
    owner: deployer,
    facets: facetNames,
  });
};

export default func;
func.tags = ["DEFODiamond"];
