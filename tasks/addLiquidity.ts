import { DEFOToken } from "@contractTypes/contracts/token";
import { announce, success } from "@utils/output.helper";
import JOE_ROUTER_ABI from "abi/joe-router.json";
import { task, types } from "hardhat/config";


export default task("add-liquidity", "adds DAI and DEFO liquidity to the pair using Joe Router")
  .addOptionalParam("dai", "DAI to add to the pool", 50000, types.int)
  .addOptionalParam("defo", "DEFO to add to the pool", 10000, types.int)
  .setAction(async ({ daiAmount, defoAmount }, hre) => {
    const { getNamedAccounts, ethers } = hre;
    const { deployer, joeRouter, dai } = await getNamedAccounts();

    const defo = await ethers.getContract<DEFOToken>("DEFOToken");

    const joeRouterContact = await ethers.getContractAt(JOE_ROUTER_ABI, joeRouter);

    announce(`Adding liquidity`);

    await joeRouterContact.addLiquidity(dai, defo, daiAmount, defoAmount, 0, 0, deployer, ethers.constants.MaxUint256, {
      gasLimit: 9999999,
    });

    success(`Added.`);
  });
