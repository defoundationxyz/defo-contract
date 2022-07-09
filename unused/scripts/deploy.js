/* global ethers */
/* eslint prefer-const: "off" */

const { getSelectors, FacetCutAction } = require("./libraries/diamond.js");

async function deployDiamond() {
  const accounts = await ethers.getSigners();
  const contractOwner = accounts[0];

  // deploy DiamondCutFacet
  const DiamondCutFacet = await ethers.getContractFactory("DiamondCutFacet");
  const diamondCutFacet = await DiamondCutFacet.deploy();
  await diamondCutFacet.deployed();
  console.log("DiamondCutFacet deployed:", diamondCutFacet.address);

  // deploy Diamond
  const Diamond = await ethers.getContractFactory("Diamond");
  const diamond = await Diamond.deploy(
    contractOwner.address,
    diamondCutFacet.address
  );
  await diamond.deployed();
  console.log("Diamond deployed:", diamond.address);

  // deploy DiamondInit
  // DiamondInit provides a function that is called when the diamond is upgraded to initialize state variables
  // Read about how the diamondCut function works here: https://eips.ethereum.org/EIPS/eip-2535#addingreplacingremoving-functions
  const DiamondInit = await ethers.getContractFactory("DiamondInit");
  const diamondInit = await DiamondInit.deploy();
  await diamondInit.deployed();
  console.log("DiamondInit deployed:", diamondInit.address);

  // deploy facets
  console.log("");
  console.log("Deploying facets");
  const FacetNames = [
    "DiamondLoupeFacet",
    "OwnershipFacet",
    "ERC721Facet",
    "ERC721EnumerableFacet",
    "GemFacet",
    "VaultStakingFacet",
    "GemGettersFacet",
    "OwnerFacet",
    "NodeLimiterFacet",
  ];
  const cut = [];
  for (const FacetName of FacetNames) {
    const Facet = await ethers.getContractFactory(FacetName);
    const facet = await Facet.deploy();
    await facet.deployed();
    console.log(`${FacetName} deployed: ${facet.address}`);
    cut.push({
      facetAddress: facet.address,
      action: FacetCutAction.Add,
      functionSelectors: getSelectors(facet),
    });
  }

  // upgrade diamond with facets
  console.log("");
  console.log("Diamond Cut:", cut);
  const diamondCut = await ethers.getContractAt("IDiamondCut", diamond.address);
  let tx;
  let receipt;
  // call to init function
  let functionCall = diamondInit.interface.encodeFunctionData("init");
  tx = await diamondCut.diamondCut(cut, diamondInit.address, functionCall);
  console.log("Diamond cut tx: ", tx.hash);
  receipt = await tx.wait();
  if (!receipt.status) {
    throw Error(`Diamond upgrade failed: ${tx.hash}`);
  }
  console.log("Completed diamond cut");

  // setting right addresses for Fuji fork
  const chainId = hre.network.config.chainId;
  const isTestEnvironment = chainId === 1337;

  const [defoaddy, daiAddress, routerAddress] =  isTestEnvironment ?
      ["0x5C7ea2D484464a6Be1c2028CE1E9e1Ec339Dd3Ae",
        "0x85a2ff500E0eD9fA93719071EA46A86198181581",
        "0xd7f655E3376cE2D7A2b08fF01Eb3B1023191A901"] :
      [
        "0x8d352F4c8643DB1d7f7FD6F2b508998EA6cb4388",
        "0xd586e7f844cea2f87f50152665bcbc2c279d8d70",
        "0x60aE616a2155Ee3d9A68541Ba4544862310933d4"
      ];

  /// TODO: this reverts with 'PAIR_EXISTS', most likely it makes sense to check the pair with the factory before deployment. Also won't be the case since we're going to deploy new tokens with EIP2612 permit(). Now commenting.
  //deploying lpManager contract
  // const LPManager = await hre.ethers.getContractFactory("LpManager");
  // const bufferThreshold = "1000000000000000000000";
  // const lpManager = await LPManager.deploy(
  //   routerAddress,
  //   [defoaddy, daiAddress],
  //   bufferThreshold
  // );
  // console.log("LpManager deployed: ", lpManager.address);
  return diamond.address;
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
if (require.main === module) {
  deployDiamond()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

deployDiamond();
exports.deployDiamond = deployDiamond;
