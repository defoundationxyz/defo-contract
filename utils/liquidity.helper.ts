import { fromWei } from "@config";
import { DEFOToken } from "@contractTypes/contracts/token";
import { HardhatRuntimeEnvironment } from "hardhat/types";

import DAI_ABI from "../abi/dai-abi.json";
import JOE_FACTORY_ABI from "../abi/joe-factory.json";
import JOE_PAIR_ABI from "../abi/joe-pair.json";
import JOE_ROUTER_ABI from "../abi/joe-router.json";

export const getLiquidityPairInfo = async (hre: HardhatRuntimeEnvironment) => {
  const { dexRouter, dai: daiAddress } = await hre.getNamedAccounts();
  const defoContract = await hre.ethers.getContract<DEFOToken>("DEFOToken");
  const daiContract = await hre.ethers.getContractAt(DAI_ABI, daiAddress);

  const dexRouterContact = await hre.ethers.getContractAt(JOE_ROUTER_ABI, dexRouter);
  const factoryAddress = await dexRouterContact.factory();
  const factoryContract = await hre.ethers.getContractAt(JOE_FACTORY_ABI, factoryAddress);

  const pairAddress = await factoryContract.getPair(daiContract.address, defoContract.address);
  const pairContract = await hre.ethers.getContractAt(JOE_PAIR_ABI, pairAddress);

  const [reserves0, reserves1] = await pairContract.getReserves();
  const [reservesDai, reservesDefo] =
    (await pairContract.token0()) == daiContract ? [reserves0, reserves1] : [reserves1, reserves0];

  return {
    daiReserve: reservesDai,
    defoReserve: reservesDefo,
    pairAddress,
  };
};

export const showLiquidityPairInfo = async (hre: HardhatRuntimeEnvironment, display: (message: string) => void) => {
  const { pairAddress, daiReserve, defoReserve } = await getLiquidityPairInfo(hre);
  display(
    `DEX Liquidity pair (${pairAddress})reserves: DAI ${Number(fromWei(daiReserve)).toFixed(3)}, DEFO ${Number(
      fromWei(defoReserve),
    ).toFixed(3)}, price: ${(Number(fromWei(daiReserve)) / Number(fromWei(defoReserve))).toFixed(3)}`,
  );
};
