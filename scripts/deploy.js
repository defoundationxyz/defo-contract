
/* global ethers */
/* eslint prefer-const: "off" */
const hre = require("hardhat");
const { ethers } = require("hardhat");

const { getSelectors, FacetCutAction } = require('./libraries/diamond.js')

async function deployDiamond() {
  // const accounts = await ethers.getSigners()
  // const contractOwner = accounts[0]
  const owner = "0x09D4198B9c75442f8C2Fae18EB5925f310003296"; 

  // deploy DiamondCutFacet
  const DiamondCutFacet = await ethers.getContractFactory('DiamondCutFacet')
  const diamondCutFacet = await DiamondCutFacet.deploy()
  await diamondCutFacet.deployed()
  console.log('DiamondCutFacet deployed:', diamondCutFacet.address)

  // deploy Diamond
  const Diamond = await ethers.getContractFactory('Diamond')
  const diamond = await Diamond.deploy(owner, diamondCutFacet.address)
  await diamond.deployed()
  console.log('Diamond deployed:', diamond.address)

  // deploy DiamondInit
  // DiamondInit provides a function that is called when the diamond is upgraded to initialize state variables
  // Read about how the diamondCut function works here: https://eips.ethereum.org/EIPS/eip-2535#addingreplacingremoving-functions
  const DiamondInit = await ethers.getContractFactory('DiamondInit')
  const diamondInit = await DiamondInit.deploy()
  await diamondInit.deployed()
  console.log('DiamondInit deployed:', diamondInit.address)

    
  // deploy facets
  console.log('')
  console.log('Deploying facets')
  const FacetNames = [
    'DiamondLoupeFacet',
    'OwnershipFacet',
    'ERC721Facet',
    'ERC721EnumerableFacet',
    'GemFacet',
    'VaultStakingFacet',
    'GettersFacet',
    'OwnerFacet',
    'NodeLimiterFacet'

  ]
  const cut = []
  for (const FacetName of FacetNames) {
    const Facet = await ethers.getContractFactory(FacetName)
    const facet = await Facet.deploy()
    await facet.deployed()
    console.log(`${FacetName} deployed: ${facet.address}`)
    cut.push({
      facetAddress: facet.address,
      action: FacetCutAction.Add,
      functionSelectors: getSelectors(facet)
    })
  }

  // upgrade diamond with facets
  console.log('')
  console.log('Diamond Cut:', cut)
  const diamondCut = await ethers.getContractAt('IDiamondCut', diamond.address)
  let tx
  let receipt
  // call to init function
  let functionCall = diamondInit.interface.encodeFunctionData('init')
  tx = await diamondCut.diamondCut(cut, diamondInit.address, functionCall)
  console.log('Diamond cut tx: ', tx.hash)
  receipt = await tx.wait()
  if (!receipt.status) {
    throw Error(`Diamond upgrade failed: ${tx.hash}`)
  }
  console.log('Completed diamond cut')
  
  let defoaddy = "0x5C7ea2D484464a6Be1c2028CE1E9e1Ec339Dd3Ae";
  let daiAddress = "0x85a2ff500E0eD9fA93719071EA46A86198181581";
  const routerAddress = "0x318067c2d4D001dC4DBA6F914421DB4912Bf5905"
    
  //deploying lpManager contract.
  const LPManager = await hre.ethers.getContractFactory("LpManager");
  const bufferThreshold= "1000000000000000000000";
  const lpManager = await LPManager.deploy(routerAddress,[defoaddy, daiAddress], bufferThreshold);
  console.log("LpManager deployed: ", lpManager.address);
  return diamond.address

}


// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
if (require.main === module) {
  deployDiamond()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error)
      process.exit(1)
    })
}

deployDiamond()
exports.deployDiamond = deployDiamond

// // When running the script with `npx hardhat run <script>` you'll find the Hardhat
// // Runtime Environment's members available in the global scope.
// const hre = require("hardhat");
// const { ethers } = require("hardhat");


// async function main() {

//   //const lpOwner = await ethers.getSigners();

//   let defoaddy = "0x5C7ea2D484464a6Be1c2028CE1E9e1Ec339Dd3Ae";
//   let daiAddress = "0x85a2ff500E0eD9fA93719071EA46A86198181581";
//   const routerAddress = "0x318067c2d4D001dC4DBA6F914421DB4912Bf5905"
//   //LpManager =  0x99818578400254b391C9c6EaCDe7882865D6E08B

//   //DEPLOYING DEFO TOKEN
//   // const Defo = await hre.ethers.getContractFactory("Defo");
//   // const defo = await Defo.deploy();

//   // //DEPLOYING DEFO TOKEN
//   // const MockDai = await hre.ethers.getContractFactory("MockDai");
//   // const mDai = await MockDai.deploy();

//   // console.log("Defo token is deployed at: ", defo.address);
//   // console.log("mDai token is deployed at: ", mDai.address);
    
//   //deploying lpManager contract.
//   const LPManager = await hre.ethers.getContractFactory("LpManager");
//   const bufferThreshold= "1000000000000000000000";//1000tokens
//   const lpManager = await LPManager.deploy(routerAddress,[defoaddy, daiAddress], bufferThreshold);
//   console.log("LpManager deployed: ", lpManager.address);

// }

// // We recommend this pattern to be able to use async/await everywhere
// // and properly handle errors.
// main()
//   .then(() => process.exit(0))
//   .catch((error) => {
//     console.error(error);
//     process.exit(1);
//   });