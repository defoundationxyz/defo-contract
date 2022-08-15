import DAI_ABI from "abi/erc20-abi.json";
import { Address } from "hardhat-deploy/dist/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

import { MAINNET_DAI_ADDRESS, MAINNET_DAI_WHALE_ADDRESS } from "../../constants/addresses";


export const beTheWhale = async (hre: HardhatRuntimeEnvironment, accountToFund: Address, amountToTransfer?: number) => {
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
  }
};
