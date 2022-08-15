import { announce, info, success } from "@utils/output.helper";
import DAI_ABI from "abi/dai-abi.json";
import chalk from "chalk";
import { signDaiPermit } from "eth-permit";
import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";


export default task(
  "permit",
  "sign 712 permit allowing all facets of DEFO Diamond to spend DAI and DEFO on behalf of the deployer",
).setAction(async (_, hre: HardhatRuntimeEnvironment) => {
  const {
    getNamedAccounts,
    deployments,
    ethers,
    ethers: {
      utils: { formatEther: fromWei },
    },
  } = hre;
  const { deployer, dai } = await getNamedAccounts();

  const { address: spenderAddress } = await deployments.get("DEFODiamond");

  const defoContract = await ethers.getContract("DEFOToken");
  const daiContract = await ethers.getContractAt(DAI_ABI, dai);

  for (const token of [defoContract, daiContract]) {
    const name = await token.name();
    announce(`Approving spending of ${name}`);
    info(`Current allowance is ${fromWei(await token.allowance(deployer, spenderAddress))}`);
    if (token == defoContract) {
      info(`Signing for ${await token.name()}`);
      const result = await signDaiPermit(ethers.provider, token.address, deployer, spenderAddress);
      await token.permit(deployer, spenderAddress, result.nonce, result.expiry, true, result.v, result.r, result.s);
    } else {
      info(`Calling approve for ${await token.name()}, max amount`);
      await token.approve(spenderAddress, ethers.constants.MaxUint256);
    }
    const allowance = await token.allowance(deployer, spenderAddress);
    success(
      `Permission to spend granted to DEFO Diamond Contract deployed to ${spenderAddress}. Now allowance is ${
        allowance.eq(ethers.constants.MaxUint256) ? chalk.magenta("Maximum") : fromWei(allowance)
      }`,
    );
  }
});
