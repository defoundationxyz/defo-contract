// import { ethers } from "hardhat";
//
// await defoInstance
//   .connect(rewardPool)
//   .approve(diamond.address, ethers.utils.parseEther("10000000000000000000000000"));
// await defoInstance.connect(vault).approve(diamond.address, ethers.utils.parseEther("10000000000000000000000000"));
// await defoInstance.connect(donations).approve(diamond.address, ethers.utils.parseEther("10000000000000000000000000"));
//
// // gem minter need to approve dai/defo
// await defoInstance.connect(treasury).approve(diamond.address, ethers.utils.parseEther("10000000000000000000000000"));
// await daiInstance.connect(treasury).approve(diamond.address, ethers.utils.parseEther("10000000000000000000000000"));
//
// await defoInstance.approve(diamond.address, ethers.utils.parseEther("10000000000000000000000000"));
// await daiInstance.approve(diamond.address, ethers.utils.parseEther("10000000000000000000000000"));
//
// await defoInstance.approve(deployer.address, ethers.utils.parseEther("10000000000000000000000000"));
// await daiInstance.approve(deployer.address, ethers.utils.parseEther("10000000000000000000000000"));
//
// // table.push(["treasury balance before mint", ethers.utils.formatEther(await defoInstance.balanceOf(treasury.address))])
// const GEM_TYPE_1 = 1;
//
// // await mintGem(gemFacetInstance, 0); // 0.75 -> treasury
// // await mintGem(gemFacetInstance, 1);
// await gemFacetInstance.connect(treasury).MintGem(0);
// await mintGem(gemFacetInstance, 1); // 7.5
// await mintGem(gemFacetInstance, 2); // 75 -> treasury
