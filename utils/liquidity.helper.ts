import { DEFOToken } from "@contractTypes/contracts/token";
import { HardhatRuntimeEnvironment } from "hardhat/types";

import DAI_ABI from "../abi/dai-abi.json";
import JOE_FACTORY_ABI from "../abi/joe-factory.json";
import JOE_PAIR_ABI from "../abi/joe-pair.json";
import JOE_ROUTER_ABI from "../abi/joe-router.json";


export const getLiquidityPairInfo = async (hre: HardhatRuntimeEnvironment) => {
  const { joeRouter, dai: daiAddress } = await hre.getNamedAccounts();
  const defoContract = await hre.ethers.getContract<DEFOToken>("DEFOToken");
  const daiContract = await hre.ethers.getContractAt(DAI_ABI, daiAddress);

  const joeRouterContact = await hre.ethers.getContractAt(JOE_ROUTER_ABI, joeRouter);
  const factoryAddress = await joeRouterContact.factory();
  const factoryContract = await hre.ethers.getContractAt(JOE_FACTORY_ABI, factoryAddress);

  const pairAddress = await factoryContract.getPair(daiContract.address, defoContract.address);
  const pairContract = await hre.ethers.getContractAt(JOE_PAIR_ABI, pairAddress);

  const [reservesDefo, reservesDai] = await pairContract.getReserves();

  return {
    daiReserve: hre.ethers.utils.formatEther(reservesDai),
    defoReserve: hre.ethers.utils.formatEther(reservesDefo),
    pairAddress,
  };
};
