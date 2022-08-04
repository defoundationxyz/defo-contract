// import {DEFOToken} from '@contractTypes/contracts/token';
// import {deployInfo} from '@utils/output.helper';
// import {DEFO_TOKEN_REWARD_POOL, DEFO_TOKEN_TOTAL_SUPPLY, DEFO_TOKEN_TREASURY} from '@config';
//
// const contract = await ethers.getContract<DEFOToken>("DEFOToken", defoTokenOwnerSigner);
//
// deployInfo(
//   `Minting ${DEFO_TOKEN_TOTAL_SUPPLY.toLocaleString()} DEFO tokens and distributing to treasury and reward pool`,
// );
// await contract.mint(defoTokenOwner, toWei(DEFO_TOKEN_TOTAL_SUPPLY.toString()));
// await contract.transfer(rewardPool, toWei(DEFO_TOKEN_REWARD_POOL.toString()));
// await contract.transfer(treasury, toWei(DEFO_TOKEN_TREASURY.toString()));
// /// TODO distribute to liquidity pool as well
