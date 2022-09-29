import { toWei } from "@config";
import { DEFOToken } from "@contractTypes/contracts/token";
import { showLiquidityPairInfo } from "@utils/liquidity.helper";
import { announce, info, networkInfo, success } from "@utils/output.helper";
import DAI_ABI from "abi/dai-abi.json";
import JOE_ROUTER_ABI from "abi/joe-router.json";
import { task, types } from "hardhat/config";

export default task("liquidity", "queries and adds DAI and DEFO liquidity to the pair")
  .addOptionalParam("dai", "DAI to add to the pool", undefined, types.int)
  .addOptionalParam("defo", "DEFO to add to the pool", undefined, types.int)
  .setAction(async ({ dai, defo }, hre) => {
    const { getNamedAccounts, ethers } = hre;
    const { stabilizer, dexRouter, dai: daiAddress } = await getNamedAccounts();
    const { Zero, MaxUint256 } = ethers.constants;

    await networkInfo(hre, info);

    if (dai !== undefined || defo !== undefined) {
      const defoContract = await ethers.getContract<DEFOToken>("DEFOToken");
      const daiContract = await ethers.getContractAt(DAI_ABI, daiAddress);
      announce(`Adding liquidity to the DAI/DEFO pair and creating it if not exists: ${dai} DAI and ${defo} DEFO`);
      const dexRouterContact = await ethers.getContractAt(JOE_ROUTER_ABI, dexRouter);
      info("Approving router for spending DAI...");
      await (await daiContract.approve(dexRouterContact.address, MaxUint256)).wait();
      info("Approving router for spending DEFO...");
      await (await defoContract.approve(dexRouterContact.address, MaxUint256)).wait();
      info("Adding liquidity...");
      await (
        await dexRouterContact.addLiquidity(
          daiContract.address,
          defoContract.address,
          toWei(dai),
          toWei(defo),
          Zero,
          Zero,
          stabilizer,
          MaxUint256,
        )
      ).wait();
      success("Added!");
    }

    await showLiquidityPairInfo(hre, info);
  });
