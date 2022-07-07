import { deploy1820 } from "deploy-eip-1820";
import { ethers } from "hardhat";
import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

import { deployAndTell } from "../utils/deployFunc";
import { FacetCutAction, getSelector, getSelectors } from "../utils/diamondLib";
import { chainName, deployAnnounce, deployInfo, deployNote, displayDeployResult } from "../utils/helpers";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const {
    getNamedAccounts,
    deployments: { deploy, diamond, getOrNull },
    getChainId,
  } = hre;
  const { deployer } = await getNamedAccounts();

  const chainId = parseInt(await getChainId(), 10);
  const isTestEnvironment = chainId === 31337 || chainId === 1337;
  const signer = await ethers.provider.getSigner(deployer);

  deployInfo("\n~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~");
  deployInfo("Decentralized Foundation Contracts - Deploy Script");
  deployInfo("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~\n");
  deployInfo(`Network: ${chainName(chainId)} (${isTestEnvironment ? "local" : "remote"})`);
  deployInfo(`Deployer: ${deployer}`);

  await deploy1820(signer);

  const diamondCutFacetResult = await deployAndTell(deploy, "DiamondCutFacet", { from: deployer });
  // const diamondResult = await deployAndTell(deploy, "Diamond", {
  //   from: deployer,
  //   args: [diamondCutFacetResult.address],
  // });
  const diamondInitResult = await deployAndTell(deploy, "DiamondInit", { from: deployer });

  const facetNames = [
    // "DiamondLoupeFacet",
    // "OwnershipFacet",
    "ERC721Facet",
    "ERC721EnumerableFacet",
    "GemFacet",
    "VaultStakingFacet",
    "GemGettersFacet",
    "OwnerFacet",
    "NodeLimiterFacet",
  ];

  /// TODO The issue is that the contract is Ownable (so it has an owner function) which conflict with hardhat-deploy default proxy which also has an owner function (hardhat-deploy default proxies are EIP-173 compatible). Using transparent proxy would help
  /// So an option would be to deploy via transparent proxy.
  const diamondResult = await deployAndTell(diamond.deploy, "Diamond", {
    diamondName: "Diamond",
    // initDiamond: "contracts/DiamondInit.sol:DiamondInit",
    from: deployer,
    owner: deployer,
    facets: facetNames,
    log: true,
  });
};

export default func;
func.tags = ["Diamond"];
