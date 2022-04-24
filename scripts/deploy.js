
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require("hardhat");
const { ethers } = require("hardhat");


async function main() {

  const lpOwner = await ethers.getSigners();

  let defoaddy = "0x8d352F4c8643DB1d7f7FD6F2b508998EA6cb4388";
  let daiAddress = "0xd586e7f844cea2f87f50152665bcbc2c279d8d70";
  const routerAddress = "0x60aE616a2155Ee3d9A68541Ba4544862310933d4"
    
  //deploying lpManager contract.
  const LPManager = await hre.ethers.getContractFactory("LpManager");
  const bufferThreshold= "1000000000000000000000";
  const lpManager = await LPManager.connect(lpOwner).deploy(routerAddress,[defoaddy, daiAddress], bufferThreshold);
  console.log("LpManager deployed: ", lpManager.address);

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
