import { DeployFunction } from "hardhat-deploy/types";

import { beTheWhale } from "../../tasks/fork/beTheWhale";
import { DEFOToken } from "../../types";
import { announce, info, success } from "../../utils/output.helper";

const func: DeployFunction = async hre => {
  const { getNamedAccounts, ethers } = hre;
  const { deployer } = await getNamedAccounts();

  const AMOUNT = 1000000;

  announce(`\n\nFunding deployer with DAI and DEFO...`);
  await beTheWhale(hre, deployer, AMOUNT);
  info(`${AMOUNT} DAI have been sent`);

  const defoContract = await ethers.getContract<DEFOToken>("DEFOToken");

  const amt = ethers.utils.parseEther(AMOUNT.toString());
  await defoContract.mint(deployer, amt);
  info(`${AMOUNT} of deployed DEFO have been minted`);
  success(`Success`);
};

export default func;
func.tags = ["FundWithDAIDEFO"];
