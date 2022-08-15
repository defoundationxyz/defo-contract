import { toWei } from "@config";
import { DEFOToken } from "@contractTypes/contracts/token";
import { announce, deployInfo, deploySuccess } from "@utils/output.helper";
import { DeployFunction } from "hardhat-deploy/types";

import DAI_ABI from "../abi/dai-abi.json";
import JOE_FACTORY_ABI from "../abi/joe-factory.json";
import JOE_PAIR_ABI from "../abi/joe-pair.json";
import JOE_ROUTER_ABI from "../abi/joe-router.json";


const func: DeployFunction = async hre => {
  const { getNamedAccounts, ethers } = hre;
  const { deployer, joeRouter, dai: daiAddress } = await getNamedAccounts();
  const { Zero, MaxUint256 } = ethers.constants;

  if (!hre.network.live) {
    const dai = 50000;
    const defo = 10000;
    announce(`Adding liquidity to the DAI/DEFO pair and creating it if not exists: ${dai} DAI and ${defo} DEFO`);

    await hre.run("fork:get-some-dai");
    await hre.run("get-some-defo");

    const defoContract = await ethers.getContract<DEFOToken>("DEFOToken");
    const daiContract = await ethers.getContractAt(DAI_ABI, daiAddress);
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
    deploySuccess(
      `Liquidity Pair Created, Liquidity Added. Current reserves: DAI ${ethers.utils.formatEther(
        reservesDai,
      )}, DEFO ${ethers.utils.formatEther(reservesDefo)}`,
    );
  } else {
    deployInfo("Scipping liquidity pair creation on live network");
  }
};

export default func;
func.tags = ["LiquidityPairDAI-DEFO"];
