import { toWei } from "@config";
import { DEFOToken } from "@contractTypes/contracts/token";
import { getLiquidityPairInfo } from "@utils/liquidity.helper";
import { info, networkInfo, success } from "@utils/output.helper";
import DAI_ABI from "abi/dai-abi.json";
import JOE_ROUTER_ABI from "abi/joe-router.json";
import { BigNumber } from "ethers";
import { task, types } from "hardhat/config";

export default task("swap", "swaps DAI to DEFO and vice versa, specify FROM token only")
  .addOptionalParam("dai", "DAI amount to swap to DEFO", undefined, types.int)
  .addOptionalParam("defo", "DEFO amount to swap to DAI", undefined, types.int)
  .setAction(async ({ dai, defo }, hre) => {
    const { getNamedAccounts, ethers } = hre;
    const { dexRouter, dai: daiAddress, deployer } = await getNamedAccounts();
    const { MaxUint256 } = ethers.constants;

    await networkInfo(hre, info);

    if ((dai !== undefined && defo !== undefined) || (dai === undefined && defo === undefined))
      throw new Error("You must specify either dai or defo amount to swap from.");

    const defoContract = await ethers.getContract<DEFOToken>("DEFOToken");
    const daiContract = await ethers.getContractAt(DAI_ABI, daiAddress);
    const dexRouterContact = await ethers.getContractAt(JOE_ROUTER_ABI, dexRouter);
    await (await daiContract.approve(dexRouterContact.address, MaxUint256)).wait();
    await (await defoContract.approve(dexRouterContact.address, MaxUint256)).wait();
    let amount: BigNumber;
    let tokens: [string, string];
    if (dai) {
      amount = toWei(dai);
      tokens = [daiContract.address, defoContract.address];
    } else {
      amount = toWei(defo);
      tokens = [defoContract.address, daiContract.address];
    }
    await (
      await dexRouterContact.swapExactTokensForTokens(
        amount,
        0,
        tokens,
        deployer,
        (await ethers.provider.getBlock("latest")).timestamp + 5000,
      )
    ).wait();
    success("Swapped!");

    const { daiReserve, defoReserve } = await getLiquidityPairInfo(hre);
    info(`Current reserves: DAI ${daiReserve}, DEFO ${defoReserve}`);
  });
