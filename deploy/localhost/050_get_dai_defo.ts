import { DeployFunction } from "hardhat-deploy/types";

import { beTheWhale } from "../../tasks/fork/beTheWhale";
import { DEFOToken } from "../../types";
import { announce, info, success } from "../../utils/helpers";

const func: DeployFunction = async hre => {
  const { getNamedAccounts, deployments, ethers } = hre;
  const { deployer } = await getNamedAccounts();

  const AMOUNT = 1000000;

  announce(`\n\nFunding deployer with DAI and DEFO...`);
  await beTheWhale(hre, deployer, AMOUNT);
  info(`${AMOUNT} DAI have been sent`);

  const defoTokenDeployment = await deployments.get("DEFOToken");
  const defoContract = await ethers.getContractAt<DEFOToken>("DEFOToken", defoTokenDeployment.address);

  const amt = ethers.utils.parseEther(AMOUNT.toString());
  await defoContract.mint(deployer, amt);
  info(`${AMOUNT} of deployed DEFO have been minted`);
  success(`Success`);
};

export default func;
func.tags = ["FundWithDAIDEFO"];
