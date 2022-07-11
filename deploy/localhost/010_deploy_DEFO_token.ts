import { DEFO_TOKEN_REWARD_POOL, DEFO_TOKEN_TOTAL_SUPPLY, DEFO_TOKEN_TREASURY } from "@config";
import { deployAndTell } from "@utils/deployFunc";
import { deployInfo, deploySuccess } from "@utils/output.helper";
import assert from "assert";
import { DeployFunction } from "hardhat-deploy/types";
import { DEFOToken } from "types";

import { namedAccountsIndex } from "../../hardhat.accounts";

const func: DeployFunction = async hre => {
  const {
    getNamedAccounts,
    deployments: { deploy },
    getChainId,
    ethers,
  } = hre;
  const { defoTokenOwner, rewardPool, treasury } = await getNamedAccounts();
  const chainId = await getChainId();

  await deployAndTell(deploy, "DEFOToken", {
    from: defoTokenOwner,
    owner: defoTokenOwner,
    args: [chainId],
  });

  const defoSignerIndex = namedAccountsIndex.defoTokenOwner as number;
  const defoTokenOwnerSigner = (await ethers.getSigners())[defoSignerIndex];

  assert(defoTokenOwnerSigner.address === defoTokenOwner);

  const contract = await ethers.getContract<DEFOToken>("DEFOToken", defoTokenOwnerSigner);

  deployInfo(
    `Minting ${DEFO_TOKEN_TOTAL_SUPPLY.toLocaleString()} DEFO tokens and distributing to treasury and reward pool`,
  );
  await contract.mint(defoTokenOwner, ethers.utils.parseEther(DEFO_TOKEN_TOTAL_SUPPLY.toString()));
  await contract.transfer(rewardPool, ethers.utils.parseEther(DEFO_TOKEN_REWARD_POOL.toString()));
  await contract.transfer(treasury, ethers.utils.parseEther(DEFO_TOKEN_TREASURY.toString()));
  /// TODO distribute to liquidity pool as well
  deploySuccess(`Done`);
};

export default func;
func.tags = ["DEFOToken"];
