import { IDEFODiamond } from "@contractTypes/contracts/interfaces";
import { DEFOToken } from "@contractTypes/contracts/token";
import { info, networkInfo, success } from "@utils/output.helper";
import { task } from "hardhat/config";

export default task("lock", "locks the contracts completely").setAction(async (_, hre) => {
  const { ethers } = hre;

  await networkInfo(hre, info);

  const defoContract = await ethers.getContract<DEFOToken>("DEFOToken");
  const defoDiamond = await ethers.getContract<IDEFODiamond>("DEFODiamond");

  await (await defoContract.pause()).wait();
  await (await defoDiamond.pause()).wait();
  await (await defoDiamond.lockMint()).wait();

  success("Locked!");
});
