import { toWei } from "@config";
import { DEFOToken } from "@contractTypes/contracts/token";
import { getLiquidityPairInfo } from "@utils/liquidity.helper";
import { announce, success } from "@utils/output.helper";
import DAI_ABI from "abi/dai-abi.json";
import JOE_ROUTER_ABI from "abi/joe-router.json";
import { task, types } from "hardhat/config";


export default task("add-liquidity", "adds DAI and DEFO liquidity to the pair using Joe Router")
  .addOptionalParam("dai", "DAI to add to the pool", 50000, types.int)
  .addOptionalParam("defo", "DEFO to add to the pool", 10000, types.int)
  .setAction(async ({ dai, defo }, hre) => {
    const { getNamedAccounts, ethers } = hre;
    const { deployer, dexRouter, dai: daiAddress } = await getNamedAccounts();
    const { Zero, MaxUint256 } = ethers.constants;

    const defoContract = await ethers.getContract<DEFOToken>("DEFOToken");
    const daiContract = await ethers.getContractAt(DAI_ABI, daiAddress);
    announce(`Adding liquidity to the DAI/DEFO pair and creating it if not exists: ${dai} DAI and ${defo} DEFO`);
    const dexRouterContact = await ethers.getContractAt(JOE_ROUTER_ABI, dexRouter);
    await daiContract.approve(dexRouterContact.address, MaxUint256);
    await defoContract.approve(dexRouterContact.address, MaxUint256);
    await dexRouterContact.addLiquidity(
      daiContract.address,
      defoContract.address,
      toWei(dai),
      toWei(defo),
      Zero,
      Zero,
      deployer,
      MaxUint256,
    );

    const { daiReserve, defoReserve } = await getLiquidityPairInfo(hre);
    success(`Added. Current reserves: DAI ${daiReserve}, DEFO ${defoReserve}`);
  });
