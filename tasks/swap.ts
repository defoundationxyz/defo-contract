import { toWei } from "@config";
import { DEFOToken } from "@contractTypes/contracts/token";
import { showLiquidityPairInfo } from "@utils/liquidity.helper";
import { info, networkInfo, success } from "@utils/output.helper";
import DAI_ABI from "abi/dai-abi.json";
import JOE_ROUTER_ABI from "abi/joe-router.json";
import { BigNumber } from "ethers";
import { task, types } from "hardhat/config";

export default task("swap", "swaps DAI to DEFO and vice versa, specify FROM token only")
  .addOptionalParam("user", "address corresponding to a named account", undefined, types.string)
  .addOptionalParam("dai", "DAI amount to swap to DEFO", undefined, types.string)
  .addOptionalParam("defo", "DEFO amount to swap to DAI", undefined, types.string)
  .setAction(async ({ user, dai, defo }, hre) => {
    const { getNamedAccounts, ethers } = hre;
    const { dexRouter, dai: daiAddress, deployer } = await getNamedAccounts();
    const { MaxUint256 } = ethers.constants;

    const account = user ?? deployer;

    await networkInfo(hre, info);
    await showLiquidityPairInfo(hre, info);

    if (
      (dai !== undefined && defo !== undefined) ||
      (dai === undefined && defo === undefined) ||
      (isNaN(Number(dai)) && isNaN(Number(defo)))
    )
      ``;
    throw new Error("You must specify either dai or defo amount to swap from.");

    const defoContract = await ethers.getContract<DEFOToken>("DEFOToken", account);
    const daiContract = await ethers.getContractAt(DAI_ABI, daiAddress, account);
    const dexRouterContact = await ethers.getContractAt(JOE_ROUTER_ABI, dexRouter, account);
    await (await daiContract.approve(dexRouterContact.address, MaxUint256)).wait();
    await (await defoContract.approve(dexRouterContact.address, MaxUint256)).wait();

    let amount: BigNumber;
    let tokens: [string, string];
    if (defo) {
      amount = toWei(defo);
      tokens = [defoContract.address, daiContract.address];
    } else {
      amount = toWei(dai);
      tokens = [daiContract.address, defoContract.address];
    }
    await (
      await dexRouterContact.swapExactTokensForTokens(
        amount,
        0,
        tokens,
        account,
        (await ethers.provider.getBlock("latest")).timestamp + 5000,
      )
    ).wait();

    success("Swapped!");
    await showLiquidityPairInfo(hre, success);
  });
