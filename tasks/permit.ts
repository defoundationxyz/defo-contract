import { announce, info, networkInfo, sayMaximumForMaxUint, success } from "@utils/output.helper";
import DAI_ABI from "abi/dai-abi.json";
import { task, types } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";

export default task("permit", "sign 712 permit allowing all facets of DEFO Diamond to spend DAI and DEFO")
  .addOptionalParam(
    "user",
    "an address to permit to (should be impersonated earlier with get-some-gems for localhost forking mainent)",
    undefined,
    types.string,
  )
  .setAction(async ({ user }, hre: HardhatRuntimeEnvironment) => {
    const { getNamedAccounts, deployments, ethers } = hre;
    const { deployer, dai } = await getNamedAccounts();
    await networkInfo(hre, info);
    const { address: spenderAddress } = await deployments.get("DEFODiamond");

    const signer = user ?? deployer;
    info(`Signer ${signer}`);

    const defoContract = await ethers.getContract("DEFOToken", signer);
    const daiContract = await ethers.getContractAt(DAI_ABI, dai, signer);

    for (const token of [defoContract, daiContract]) {
      const name = await token.name();
      announce(`Approving spending of ${name}`);
      let allowance = await token.allowance(signer, spenderAddress);
      info(
        `Current allowance is ${sayMaximumForMaxUint(allowance)} ${
          allowance.eq(ethers.constants.MaxUint256) && "already"
        }`,
      );
      if (!allowance.eq(ethers.constants.MaxUint256)) {
        if (token == defoContract) {
          ///fixme not signing since provider does not recognize address impersonated earlier with 'eth-permit', not a bit deal though to call approve in the task
          // import { signDaiPermit } from "eth-permit";
          // info(`Signing for ${await token.name()}`);
          // const result = await signDaiPermit(ethers.provider, token.address, signer, spenderAddress);
          // await token.permit(signer, spenderAddress, result.nonce, result.expiry, true, result.v, result.r, result.s);
          info(`Calling approve for ${await token.name()}, max amount`);
          await token.approve(spenderAddress, ethers.constants.MaxUint256);
        } else {
          info(`Calling approve for ${await token.name()}, max amount`);
          await token.approve(spenderAddress, ethers.constants.MaxUint256);
        }
        allowance = await token.allowance(signer, spenderAddress);
        success(
          `Permission to spend granted to DEFO Diamond Contract deployed to ${spenderAddress}. Now allowance is ${sayMaximumForMaxUint(
            allowance,
          )}`,
        );
      }
    }
  });
