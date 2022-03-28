
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require("hardhat");
const { ethers } = require("hardhat");


async function main() {
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');
  let defoOwner, routerAddy,acc1, acc2, acc3, acc4, acc5;
  [defoOwner, routerAddy,acc1, acc2, acc3, acc4, acc5] = await ethers.getSigners();
//console.log(defoOwner.address)
  // We get the contract to deploy
  const Defo = await hre.ethers.getContractFactory("Defo");
  const defo = await Defo.deploy(defoOwner.address);
  await defo.deployed();
  console.log("Defo token deployed to:", defo.address);

  const LPManager = await hre.ethers.getContractFactory("LpManager");
  const lpManager = await LPManager.deploy
  (routerAddy.address, [defo.address, acc1.address], 1000000);
  await lpManager.deployed();
  console.log("LpManager deployed to:", lpManager.address);


}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
