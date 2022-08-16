import { deployAndTell } from "@utils/deployFunc";
import { deploySuccess } from "@utils/output.helper";
import assert from "assert";
import { DeployFunction } from "hardhat-deploy/types";

import { namedAccountsIndex } from "../hardhat.accounts";


const func: DeployFunction = async hre => {
  const {
    getNamedAccounts,
    deployments: { deploy },
    getChainId,
    ethers,
  } = hre;

  const { defoTokenOwner } = await getNamedAccounts();
  const chainId = await getChainId();

  await deployAndTell(deploy, "DEFOToken", {
    from: defoTokenOwner,
    proxy: true,
    owner: defoTokenOwner,
    args: [chainId],
  });

  const defoSignerIndex = namedAccountsIndex.defoTokenOwner as number;
  const defoTokenOwnerSigner = (await ethers.getSigners())[defoSignerIndex];

  assert(defoTokenOwnerSigner.address === defoTokenOwner);

  deploySuccess(`Done`);
};

export default func;
func.tags = ["DEFOToken"];
