import { deployAndTell } from "@utils/deployFunc";
import { deployAnnounce } from "@utils/output.helper";
import { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async hre => {
  const {
    getNamedAccounts,
    deployments: { deploy },
  } = hre;
  deployAnnounce("Deploying DefoVaultNFT...");
  const { deployer } = await getNamedAccounts();

  // await deployAndTell(deploy, "DefoVaultNFT", {
  //   proxy: false,
  //   from: deployer,
  //   owner: deployer,
  //   args: [],
  //   gasLimit: 8_000_000,
  // });
  await deployAndTell(deploy, "DefoVaultNFT", {
    proxy: false,
    from: deployer,
    owner: deployer,
    args: [],
    gasLimit: 8_000_000,
  });
};

export default func;
func.tags = ["DefoVaultNFT"];
