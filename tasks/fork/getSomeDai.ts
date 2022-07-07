import { task, types } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";

import DAI_ABI from "../../abi/erc20-abi.json";
import { MAINNET_DAI_ADDRESS, MAINNET_DAI_WHALE_ADDRESS } from "../../constants/addresses";
import { info, success } from "../../utils/helpers";

const beTheWhale = async (hre: HardhatRuntimeEnvironment, accountToFund: string, amountToTransfer?: number) => {
  const accountToInpersonate = MAINNET_DAI_WHALE_ADDRESS;
  await hre.network.provider.request({
    method: "hardhat_impersonateAccount",
    params: [accountToInpersonate],
  });
  const whaleSigner = await hre.ethers.getSigner(accountToInpersonate);
  for (const token of [MAINNET_DAI_ADDRESS]) {
    const contract = new hre.ethers.Contract(token, DAI_ABI, whaleSigner);
    const toTransfer =
      (amountToTransfer && hre.ethers.utils.parseEther(amountToTransfer.toString())) ??
      (await contract.balanceOf(accountToInpersonate));
    await contract.connect(whaleSigner).transfer(accountToFund, toTransfer);
    info(`sent ${toTransfer} of token ${token} to ${accountToFund}`);
  }
};

export default task("fork:get-some-dai", "Distribute DAI from AAVE")
  .addOptionalParam("amount", "The amount to transfer to the deployer", 1000, types.int)
  .setAction(async ({ amount }, hre) => {
    info("Gathering DAI from AAVE...");

    const { getNamedAccounts } = hre;
    const { deployer } = await getNamedAccounts();

    await beTheWhale(hre, deployer, amount);
    success("Done!");
  });
