import { ConfigFacet, ProtocolConfigStructOutput } from "@contractTypes/contracts/facets/ConfigFacet";
import { announce, outputFormatter } from "@utils/output.helper";
import { parseTimeInput } from "@utils/taskParamsInput.helper";
import { task, types } from "hardhat/config";


export default task("reconfigure", "Reconfigure the contract, display configuration if no params provided")
  .addOptionalParam(
    "rewardPeriod",
    "reward period in a human-readable format: '1w', '1day', '20h', etc.",
    undefined,
    types.string,
  )
  .addOptionalParam("amount", "The amount to transfer to the deployer", 100000, types.int)
  .setAction(async (taskArgs, hre) => {
    const contract = await hre.ethers.getContract<ConfigFacet>("DEFODiamond_DiamondProxy");

    const showConfig = async (text: string) => {
      const configOutput: ProtocolConfigStructOutput = await contract.getConfig();
      announce(`${text} contract configuration:`);
      console.table(outputFormatter(configOutput));
      // Object.entries(config).forEach(([key, value]) =>
      //   info(`${key.toString().padEnd(30)} : ${taskArgs[key] ? chalk.green(value.toString()) : value.toString()}`),
      // );
    };

    await showConfig("Current ");
    if (taskArgs.rewardPeriod) {
      const { seconds, human } = parseTimeInput(taskArgs.rewardPeriod);
      announce(`Setting reward period ${seconds} (${human})`);
      await contract.setConfigRewardPeriod(seconds);
    }
  });
