import { DeployFunction } from "hardhat-deploy/types";

import {
  CHARITY_RATE,
  DIAMOND_GEM,
  LIQUIDITY_DAI_RATE,
  LIQUIDITY_DEFO_RATE,
  MAINTENANCE_DAYS,
  MINT_LIMIT_HOURS,
  MIN_REWARD_TIME,
  REWARD_TAX_TABLE,
  RUBY_GEM,
  SAPHIRE_GEM,
  TREASURY_DAI_RATE,
  TREASURY_DEFO_RATE,
} from "../../constants";
import { OwnerFacet } from "../../types";
import { deployAnnounce, deploySuccess } from "../../utils/helpers";

const func: DeployFunction = async hre => {
  const { getNamedAccounts, deployments } = hre;
  const { deployer, donations, team, vault } = await getNamedAccounts();

  const ownerFacetInstance = await hre.ethers.getContractAt<OwnerFacet>(
    "OwnerFacet",
    (
      await deployments.get("DEFODiamond")
    ).address,
  );
  deployAnnounce("\n\nInitializing OwnerFacet with numeric parameters from  constants/config.ts ...");

  await ownerFacetInstance.setAddressAndDistTeam(team, TREASURY_DAI_RATE, TREASURY_DEFO_RATE);
  await ownerFacetInstance.setAddressAndDistLiquidity(deployer, LIQUIDITY_DEFO_RATE, LIQUIDITY_DAI_RATE);
  await ownerFacetInstance.setAddressDonation(donations, CHARITY_RATE);
  await ownerFacetInstance.setAddressVault(vault);
  await ownerFacetInstance.setMinRewardTime(MIN_REWARD_TIME);

  await ownerFacetInstance.setRewardTax(REWARD_TAX_TABLE);
  await ownerFacetInstance.setGemSettings("0", SAPHIRE_GEM);
  await ownerFacetInstance.setGemSettings("1", RUBY_GEM);
  await ownerFacetInstance.setGemSettings("2", DIAMOND_GEM);
  // activate limit hours
  await ownerFacetInstance.setMintLimitHours(MAINTENANCE_DAYS);
  // activate maintenance days
  await ownerFacetInstance.setMaintenanceDays("30");

  deploySuccess(`Success`);
};

export default func;
func.tags = ["DiamondInitialize"];
