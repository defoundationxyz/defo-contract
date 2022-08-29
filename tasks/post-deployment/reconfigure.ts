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
  .addOptionalParam(
    "maintenancePeriod",
    "maintenance period in a human-readable format without spaces: '1w', '1day', '20h', etc.",
    undefined,
    types.string,
  )
  .addOptionalParam(
    "taxScalePeriod",
    "taxScale update since last claim period in a human-readable format without spaces: '1w', '1day', '20h', etc.",
    undefined,
    types.string,
  )
  .addOptionalParam(
    "vaultWithdrawalTax",
    "vault withdrawal tax rate multiplied by 100, e.g. 1000 for 10%",
    undefined,
    types.int,
  )
  .addOptionalParam(
    "wallets",
    "set all protocol wallets, note, all 6 should be provided comma separated with no spaces, e.g. 0x001,0x002,0x003,0x004,0x005,0x006",
    undefined,
    types.string,
  )

  .setAction(async (taskArgs, hre) => {
    const contract = await hre.ethers.getContract<ConfigFacet>("DEFODiamond_DiamondProxy");
    let configOutput: ProtocolConfigStructOutput = await contract.getConfig();

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

    if (taskArgs.maintenancePeriod) {
      const { seconds, human } = parseTimeInput(taskArgs.maintenancePeriod);
      announce("Updating reward period");
      announce(
        `Was ${outputFormatKeyValue(
          "maintenancePeriod",
          configOutput.maintenancePeriod,
        )}, setting  ${seconds} seconds (${human})`,
      );
      await contract.setConfigMaintenancePeriod(seconds);
    }
    if (taskArgs.taxScalePeriod) {
      const { seconds, human } = parseTimeInput(taskArgs.taxScalePeriod);
      announce("Updating reward period");
      announce(
        `Was ${outputFormatKeyValue(
          "taxScaleSinceLastClaimPeriod",
          configOutput.taxScaleSinceLastClaimPeriod,
        )}, setting  ${seconds} seconds (${human})`,
      );
      await contract.setConfigTaxScaleSinceLastClaimPeriod(seconds);
    }

    if (taskArgs.vaultWithdrawalTax) {
      announce("Updating vaultWithdrawalTax");
      announce(
        `Was ${outputFormatKeyValue("vaultWithdrawalTaxRate", configOutput.vaultWithdrawalTaxRate)}, setting  ${
          taskArgs.vaultWithdrawalTax
        }`,
      );
      await contract.setConfigVaultWithdrawalTaxRate(taskArgs.vaultWithdrawalTax);
    }

    if (taskArgs.wallets) {
      announce("Updating wallets");
      announce(`Was ${outputFormatKeyValue("wallets", configOutput.wallets.toString())}, setting  ${taskArgs.wallets}`);
      const walletsArray = String(taskArgs.wallets).split(",");
      if (walletsArray.length < 7)
        throw new Error(
          "There should be all 7 wallets provided in the following string order: Treasury, RewardPool, LiquidityPair, Team, Charity, Vault, RedeemContract",
        );
      await contract.setConfigWallets(walletsArray);
    }

    configOutput = await contract.getConfig();
    announce(`Contract configuration:`);
    console.table(outputFormatter(configOutput));
  });
