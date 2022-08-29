import { ConfigFacet, ProtocolConfigStructOutput } from "@contractTypes/contracts/facets/ConfigFacet";
import { announce, outputFormatKeyValue, outputFormatter } from "@utils/output.helper";
import { parseTimeInput } from "@utils/taskParamsInput.helper";
import { task, types } from "hardhat/config";


export default task("config", "Reconfigure the contract, display configuration if no params provided")
  .addOptionalParam(
    "rewardPeriod",
    "reward period in a human-readable format without spaces: '1w', '1day', '20h', etc.",
    undefined,
    types.string,
  )
  .addOptionalParam("amount", "The amount to transfer to the deployer", 100000, types.int)
  .setAction(async (taskArgs, hre) => {
    const contract = await hre.ethers.getContract<ConfigFacet>("DEFODiamond_DiamondProxy");
    const configOutput: ProtocolConfigStructOutput = await contract.getConfig();
    announce(`Current contract configuration:`);
    console.table(outputFormatter(configOutput));

    if (taskArgs.rewardPeriod) {
      const { seconds, human } = parseTimeInput(taskArgs.rewardPeriod);
      announce("Updating reward period");
      announce(
        `Was ${outputFormatKeyValue(
          "rewardPeriod",
          configOutput.rewardPeriod,
        )}, setting  ${seconds} seconds (${human})`,
      );
      await contract.setConfigRewardPeriod(seconds);
    }

    if (taskArgs.rewardPeriod) {
      const { seconds, human } = parseTimeInput(taskArgs.rewardPeriod);
      announce("Updating reward period");
      announce(
        `Was ${outputFormatKeyValue(
          "rewardPeriod",
          configOutput.rewardPeriod,
        )}, setting  ${seconds} seconds (${human})`,
      );
      await contract.setConfigRewardPeriod(seconds);
    }
  });
