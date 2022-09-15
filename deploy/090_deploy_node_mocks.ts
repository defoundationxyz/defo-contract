import { presaleNodes } from "@constants/addresses";
import { DiamondNode } from "@contractTypes/contracts/presale/presaleDiamond.sol";
import { isFuji } from "@utils/chain.helper";
import { deployAndTell } from "@utils/deployFunc";
import { deployAnnounce, deployInfo } from "@utils/output.helper";
import { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async hre => {
  const {
    getNamedAccounts,
    deployments: { deploy },
    ethers,
  } = hre;
  if (await isFuji(hre)) {
    deployAnnounce("Deploying mock presale nodes for testing");
    const { deployer, dai } = await getNamedAccounts();

    for (const nodeContractName of presaleNodes) {
      await deployAndTell(deploy, nodeContractName, {
        from: deployer,
        owner: deployer,
        args: [dai],
      });
      const contract = await ethers.getContract<DiamondNode>(nodeContractName);
      if (!(await contract.activeSale())) {
        await (await contract.setSaleState()).wait();
        await contract.giveAwayMint();
      }
    }
  } else deployInfo("Skipping nodes deployment on mainnet and localhost (forking from mainnet)");
};

export default func;
func.tags = ["PresaleNodes"];
