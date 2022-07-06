import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import type { Diamond } from "@src/types/Greeter";
import type { Diamond__factory } from "@src/types/factories/Diamond__factory";
import { DeployFunction } from "hardhat-deploy/types";
import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import type { TaskArguments } from "hardhat/types";

task("deploy:Diamond").setAction(async function (taskArguments: TaskArguments, { ethers }) {
  const deploy: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
    const { deployments, getNamedAccounts } = hre;
    const { deploy } = deployments;

    const { deployer, tokenOwner } = await getNamedAccounts(); // Fetch the accounts. These can be configured in hardhat.config.ts as explained above.

    await deploy("Token", {
      from: deployer, // Deployer will be performing the deployment transaction.
      args: [tokenOwner], // tokenOwner is the address used as the first argument to the Token contract's constructor.
      log: true, // Display the address and gas used in the console (not when run in test though).
    });
  };

  const signers: SignerWithAddress[] = await ethers.getSigners();
  const greeterFactory: Greeter__factory = <Greeter__factory>await ethers.getContractFactory("Greeter");
  const greeter: Greeter = <Greeter>await greeterFactory.connect(signers[0]).deploy(taskArguments.greeting);
  await greeter.deployed();
  console.log("Greeter deployed to: ", greeter.address);
});
