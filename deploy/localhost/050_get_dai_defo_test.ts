import { fundDefo } from "@utils/actions.helper";
import { isTestEnvironment } from "@utils/chain.helper";
import { announce, info, success } from "@utils/output.helper";
import { DeployFunction } from "hardhat-deploy/types";
import { beTheWhale } from "tasks/fork/beTheWhale";

/**
 * @dev To be used in the test network only since it funds the deployer with DEFO minted above agreed total supply
 */
const func: DeployFunction = async hre => {
  if (await isTestEnvironment(hre)) {
    const { getNamedAccounts } = hre;
    const { deployer } = await getNamedAccounts();

    const AMOUNT = 100_000;

    announce(`\n\nFunding deployer with DAI and DEFO for tests...`);
    await beTheWhale(hre, deployer, AMOUNT);
    info(`${AMOUNT.toLocaleString()} DAI have been sent`);

    await fundDefo(hre, deployer, AMOUNT);
    info(`${AMOUNT.toLocaleString()} of deployed DEFO have been minted`);
  }
  success(`Success`);
};

export default func;
func.tags = ["TestFunding"];
