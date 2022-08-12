import { toWei } from "@config";
import { DEFOToken } from "@contractTypes/contracts/token";
import { announce, success } from "@utils/output.helper";
import DAI_ABI from "abi/dai-abi.json";
import JOE_FACTORY_ABI from "abi/joe-factory.json";
import JOE_PAIR_ABI from "abi/joe-pair.json";
import JOE_ROUTER_ABI from "abi/joe-router.json";
import { task, types } from "hardhat/config";


export default task("add-liquidity", "adds DAI and DEFO liquidity to the pair using Joe Router")
  .addOptionalParam("dai", "DAI to add to the pool", 50000, types.int)
  .addOptionalParam("defo", "DEFO to add to the pool", 10000, types.int)
  .setAction(async ({ dai, defo }, hre) => {
    const { getNamedAccounts, ethers } = hre;
    const { deployer, joeRouter, dai: daiAddress } = await getNamedAccounts();
    const { Zero, MaxUint256 } = ethers.constants;

    const defoContract = await ethers.getContract<DEFOToken>("DEFOToken");
    const daiContract = await ethers.getContractAt(DAI_ABI, daiAddress);
    announce(`Adding liquidity to the DAI/DEFO pair and creating it if not exists: ${dai} DAI and ${defo} DEFO`);
    const joeRouterContact = await ethers.getContractAt(JOE_ROUTER_ABI, joeRouter);
    await daiContract.approve(joeRouterContact.address, MaxUint256);
    await defoContract.approve(joeRouterContact.address, MaxUint256);
    await joeRouterContact.addLiquidity(
      daiContract.address,
      defoContract.address,
      toWei(dai),
      toWei(defo),
      Zero,
      Zero,
      deployer,
      MaxUint256,
    );

    const factoryAddress = await joeRouterContact.factory();
    const factoryContract = await ethers.getContractAt(JOE_FACTORY_ABI, factoryAddress);

    const pairAddress = factoryContract.getPair(daiContract.address, defoContract.address);
    const pairContract = await ethers.getContractAt(JOE_PAIR_ABI, pairAddress);

    const [reservesDai, reservesDefo] = await pairContract.getReserves();
    success(
      `Added. Current reserves: DAI ${ethers.utils.formatEther(reservesDai)}, DEFO ${ethers.utils.formatEther(
        reservesDefo,
      )}`,
    );
  });
