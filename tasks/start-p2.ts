import { CONFIG_PER_NETWORK, Wallets } from "@config";
import { ConfigFacet, ProtocolConfigStructOutput } from "@contractTypes/contracts/facets/ConfigFacet";
import { announce, info, networkInfo, outputFormatKeyValue, outputFormatter } from "@utils/output.helper";
import { parseTimeInput } from "@utils/taskParamsInput.helper";
import { task, types } from "hardhat/config";

export default task(
  "start-p2",
  "Start Phase 2: pause the contract, set P2 start date to  current time, calculate ROT of everyone",
)
  .addOptionalParam(
    "test",
    "update the configuration except payment tokens and wallets from the config/contracts.config.ts",
    true,
    types.boolean,
  )
  .addOptionalParam("excel", "create an excel file with rot and DAI earned for each user", true, types.boolean)

  .setAction(async (taskArgs, hre) => {
    const contract = await hre.ethers.getContract<ConfigFacet>("DEFODiamond");
    let configOutput: ProtocolConfigStructOutput = await contract.getConfig();
    await networkInfo(hre, info);

    if (taskArgs.update) {
      const chainId = Number(await hre.getChainId()) as keyof typeof CONFIG_PER_NETWORK;
      // const protocolConfig = CONFIG_PER_NETWORK[chainId].protocol;
      const gemConfig = CONFIG_PER_NETWORK[chainId].gems;
      // const currentConfig = await contract.getConfig();
      announce("Updating configuration...");
      // await (
      //   await contract.setConfig({
      //     ...protocolConfig,
      //     paymentTokens: currentConfig.paymentTokens,
      //     wallets: currentConfig.wallets,
      //   })
      // ).wait();
      // await (await contract.approveDefoForRouter(await hre.ethers. )).wait();

      announce("Configuring gem types...");
      await (await contract.setGemTypesConfig(gemConfig)).wait();
      info("Configured.");
    }

    if (taskArgs.rewardPeriod) {
      const { seconds, human } = parseTimeInput(taskArgs.rewardPeriod);
      announce("Updating reward period...");
      announce(
        `Was ${outputFormatKeyValue(
          "rewardPeriod",
          configOutput.rewardPeriod,
        )}, setting  ${seconds} seconds (${human})`,
      );
      await (await contract.setConfigRewardPeriod(seconds)).wait();
    }

    if (taskArgs.maintenancePeriod) {
      const { seconds, human } = parseTimeInput(taskArgs.maintenancePeriod);
      announce("Updating maintenance period");
      announce(
        `Was ${outputFormatKeyValue(
          "maintenancePeriod",
          configOutput.maintenancePeriod,
        )}, setting  ${seconds} seconds (${human})`,
      );
      await (await contract.setConfigMaintenancePeriod(seconds)).wait();
    }
    if (taskArgs.taxScalePeriod) {
      const { seconds, human } = parseTimeInput(taskArgs.taxScalePeriod);
      announce("Updating tax scale period");
      announce(
        `Was ${outputFormatKeyValue(
          "taxScaleSinceLastClaimPeriod",
          configOutput.taxScaleSinceLastClaimPeriod,
        )}, setting  ${seconds} seconds (${human})`,
      );
      await (await contract.setConfigTaxScaleSinceLastClaimPeriod(seconds)).wait();
    }

    if (taskArgs.vaultWithdrawalTax) {
      announce("Updating vaultWithdrawalTax");
      announce(
        `Was ${outputFormatKeyValue("vaultWithdrawalTaxRate", configOutput.vaultWithdrawalTaxRate)}, setting  ${
          taskArgs.vaultWithdrawalTax
        }`,
      );
      await (await contract.setConfigVaultWithdrawalTaxRate(taskArgs.vaultWithdrawalTax)).wait();
    }

    if (taskArgs.wallets) {
      announce("Updating wallets");
      announce(`Was ${outputFormatKeyValue("wallets", configOutput.wallets.toString())}, setting  ${taskArgs.wallets}`);
      const walletsArray = String(taskArgs.wallets).split(",");
      if (walletsArray.length < 7)
        throw new Error(
          `There should be all 7 wallets provided in the following string order: ${Object.values(Wallets)
            .filter(i => isNaN(Number(i)))
            .toString()}`,
        );
      await (await contract.setConfigWallets(walletsArray)).wait();
    }

    configOutput = await contract.getConfig();
    announce(`Contract configuration:`);
    console.table(outputFormatter(configOutput));
  });
