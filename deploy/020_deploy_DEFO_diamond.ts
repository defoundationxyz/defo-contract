import { deployAndTell } from "@utils/deployFunc";
import { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async hre => {
  const { getNamedAccounts, deployments } = hre;
  const { diamond } = deployments;
  const { deployer } = await getNamedAccounts();

  const facetNames = [
    "YieldGemFacet",
    "ConfigFacet",
    "RewardsFacet",
    "VaultFacet",
    "DonationsFacet",
    "MaintenanceFacet",
    "TransferLimitFacet",
  ];

  await deployAndTell(diamond.deploy, "DEFODiamond", {
    from: deployer,
    owner: deployer,
    facets: facetNames,
    deterministicDeployment: true,
  });
};

export default func;
func.tags = ["DEFODiamond"];
