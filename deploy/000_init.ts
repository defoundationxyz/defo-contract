import { chainName } from "@utils/chain.helper";
import { deployError, deployInfo } from "@utils/output.helper";
import assert from "assert";
import chalk from "chalk";
import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

import { namedAccountsIndex } from "../hardhat.accounts";


const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const {
    getNamedAccounts,
    ethers: {
      getSigners,
      provider: { getBalance },
      utils: { formatEther: fromWei },
    },
  } = hre;
  const namedAccounts = await getNamedAccounts();
  const signers = await getSigners();

  deployInfo("\n~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~");
  deployInfo("Decentralized Foundation Contracts - Deploy Script");
  deployInfo("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~\n");
  deployInfo(
    `Network:  ${await chainName(hre)} (${hre.network.live ? chalk.red("remote") : chalk.yellow("local")})\n\n`,
  );
  assert(
    namedAccounts.treasury === signers[namedAccountsIndex.treasury as number].address &&
      namedAccounts.vault === signers[namedAccountsIndex.vault as number].address &&
      namedAccounts.rewardPool === signers[namedAccountsIndex.rewardPool as number].address &&
      namedAccounts.donations === signers[namedAccountsIndex.donations as number].address &&
      namedAccounts.team === signers[namedAccountsIndex.team as number].address,
    chalk.red(
      "Configuration error, named accounts do not correspond to signers: check the order of the Hardhat accounts.",
    ),
  );

  const accountsThatShouldBeFunded = [
    "deployer",
    "treasury",
    "donations",
    "defoTokenOwner",
    "rewardPool",
    "vault",
    "team",
  ];

  const namesAccountsWithBalance = await Promise.all(
    Object.entries(namedAccounts).map(async ([name, address]) => {
      return { name, address, balance: await getBalance(address) };
    }),
  );

  let balanceCheckError = false;

  await namesAccountsWithBalance.forEach(account => {
    const shouldBeFundedButNot = accountsThatShouldBeFunded.includes(account.name) && account.balance.isZero();
    const deployInfoOrError = shouldBeFundedButNot
      ? (message: string) => {
          balanceCheckError = true;
          deployError(message);
        }
      : deployInfo;
    deployInfoOrError(
      `${account.name.padEnd(15)}: ${chalk.yellow(account.address)}, AVAX balance: ${fromWei(account.balance)} ${
        shouldBeFundedButNot ? "SHOULD BE FUNDED" : ""
      }`,
    );
  });
  if (balanceCheckError)
    throw new Error(chalk.red(`balances of the accounts marked above should not be zero, send some AVAX to proceed`));
};

export default func;
func.tags = ["Init"];
