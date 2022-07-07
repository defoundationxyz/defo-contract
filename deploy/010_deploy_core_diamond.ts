import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

import { deployAndTell } from "../utils/deployFunc";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
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
    log: true,
  });
};

export default func;
func.tags = ["Diamond"];
