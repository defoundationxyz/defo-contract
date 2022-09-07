import { IDEFODiamond } from "@contractTypes/contracts/interfaces";
import { getLiquidityPairInfo } from "@utils/liquidity.helper";
import { announce, info, networkInfo } from "@utils/output.helper";
import DAI_ABI from "abi/dai-abi.json";
import assert from "assert";
import chalk from "chalk";
import { task } from "hardhat/config";

task("accounts", "Get the address and balance information (AVAX, DEFO, DAI) for the accounts.")
  .addOptionalParam("user", "0x... address to check")
  .setAction(async ({ user }, hre) => {
    const {
      getNamedAccounts,
      deployments,
      ethers,
      ethers: {
        utils: { formatEther: fromWei },
      },
    } = hre;
    const namedAccounts = await getNamedAccounts();
    const { dai, forkedDefoToken } = namedAccounts;
    info("\n 📡 Querying balances...");
    const daiContract = await ethers.getContractAt(DAI_ABI, dai);
    const defoTokenDeployment = (await deployments.getOrNull("DEFOToken"))?.address || "";
    const diamondDeployment = await deployments.get("DEFODiamond");
    const diamondContract = await ethers.getContract<IDEFODiamond>("DEFODiamond");

    const accounts = user
      ? { user }
      : {
          ...namedAccounts,
          DEFOdiamond: diamondDeployment.address,
        };

    const defoContract =
      forkedDefoToken || defoTokenDeployment
        ? await ethers.getContractAt("DEFOToken", forkedDefoToken || defoTokenDeployment)
        : null;
    await networkInfo(hre, info);
    assert(defoContract, "defoContract is null");
    announce(
      `DEFO token is ${chalk.yellow(
        forkedDefoToken ? "on live network" : defoTokenDeployment ? "deployed locally" : chalk.red("not deployed!"),
      )}. Address: ${defoContract.address}`,
    );

    const table = await Promise.all(
      Object.entries(accounts).map(async ([accountName, accountAddress]) => {
        return {
          name: accountName,
          address: accountAddress,
          AVAX: Number(Number(fromWei(await ethers.provider.getBalance(accountAddress))).toFixed(3)),
          DAI: Number(Number(fromWei(await daiContract.balanceOf(accountAddress))).toFixed(3)),
          DEFO: defoContract && Number(Number(fromWei(await defoContract.balanceOf(accountAddress))).toFixed(3)),
          gems: Number(await diamondContract.balanceOf(accountAddress)),
        };
      }),
    );
    console.table(table);
    const { pairAddress, daiReserve, defoReserve } = await getLiquidityPairInfo(hre);
    info(`DEX Liquidity pair (${pairAddress})reserves: DAI ${daiReserve}, DEFO ${defoReserve}`);
  });
