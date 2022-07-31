import { DEFO_TOKEN_REWARD_POOL, DEFO_TOKEN_TOTAL_SUPPLY, DEFO_TOKEN_TREASURY } from "@config-fuji";
import { deployAndTell } from "@utils/deployFunc";
import { deployInfo, deploySuccess } from "@utils/output.helper";
import assert from "assert";
import { DeployFunction } from "hardhat-deploy/types";
import { DEFOToken } from "types";

const func: DeployFunction = async hre => {
  const {
    getNamedAccounts,
    deployments: { deploy },
    getChainId,
    ethers,
    ethers: {
      utils: { parseEther: toWei },
    },
  } = hre;
  const { deployer } = await getNamedAccounts();
  const chainId = await getChainId();

  await deployAndTell(deploy, "DEFOToken", {
    from: deployer,
    owner: deployer,
    args: [chainId],
  });

  const defoTokenOwnerSigner = (await ethers.getSigners())[0];

  assert(defoTokenOwnerSigner.address === deployer);

  const contract = await ethers.getContract<DEFOToken>("DEFOToken", defoTokenOwnerSigner);

  deployInfo(
    `Minting ${DEFO_TOKEN_TOTAL_SUPPLY.toLocaleString()} DEFO tokens and distributing to treasury and reward pool`,
  );
  await contract.mint(deployer, toWei(DEFO_TOKEN_TOTAL_SUPPLY.toString()));
  /// TODO distribute liquidity to test addresses
  deploySuccess(`Done`);
};

export default func;
func.tags = ["DEFOTokenFuji"];
