import { task } from "hardhat/config";

import ERC20_ABI from "../abi/defo-abi.json";
import { info } from "../utils/helpers";

task("accounts", "Get the addresses and balance information (AVAX, DEFO, DAI) for the accounts.", async (_, hre) => {
  const { getNamedAccounts } = hre;
  const namedAccounts = await getNamedAccounts();
  const { dai, defoToken } = namedAccounts;
  info("\n 📡 Querying balances...");
  const daiContract = await hre.ethers.getContractAt(ERC20_ABI, dai);
  const defoContract = await hre.ethers.getContractAt(ERC20_ABI, defoToken);
  const table = await Promise.all(
    Object.entries(namedAccounts).map(async ([accountName, accountAddress]) => {
      return {
        name: accountName,
        address: accountAddress,
        AVAX: Number(hre.ethers.utils.formatEther(await hre.ethers.provider.getBalance(accountAddress))),
        DAI: Number(hre.ethers.utils.formatEther(await daiContract.balanceOf(accountAddress))),
        DEFO: Number(hre.ethers.utils.formatEther(await defoContract.balanceOf(accountAddress))),
      };
    }),
  );
  console.table(table);
});
