const hre = require("hardhat");

async function main() {
  const DefoLimiter = await hre.ethers.getContractFactory("DefoLimiter");
  const defolimiter = await DefoLimiter.deploy("Hello, Hardhat!");

  await defolimiter.deployed();

  console.log("DefoLimiter deployed to:", defolimiter.address);

  const Redeem = await hre.ethers.getContractFactory("Redeem");
  const redeem = await Redeem.deploy("Hello, Hardhat!");

  await redeem.deployed();

  console.log("Redeem deployed to:", redeem.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
