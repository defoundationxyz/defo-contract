import {
  CHARITY_RATE,
  DIAMOND_GEM,
  LIQUIDITY_DAI_RATE,
  LIQUIDITY_DEFO_RATE,
  MAINTENANCE_PERIOD,
  MINT_LIMIT_PERIOD,
  REWARD_TAX_TABLE,
  RUBY_GEM,
  SAPHIRE_GEM,
  SECONDS_IN_A_WEEK,
  TAPER_RATE,
  TEAM_DAI_RATE,
  TEAM_DEFO_RATE,
  TREASURY_DAI_RATE,
  TREASURY_DEFO_RATE,
} from "@config";
import { deployAnnounce, deploySuccess } from "@utils/output.helper";
import { DeployFunction } from "hardhat-deploy/types";

import { OwnerFacet } from "../../types";

const func: DeployFunction = async hre => {
  const { getNamedAccounts, ethers } = hre;
  const { deployer, donations, team, vault } = await getNamedAccounts();

  const ownerFacetInstance = await ethers.getContract<OwnerFacet>("DEFODiamond_DiamondProxy");

  deployAnnounce("\n\nInitializing OwnerFacet with numeric parameters from  constants/config.ts ...");

  await Promise.all([
    ownerFacetInstance.setAddressAndDistTeam(team, TEAM_DAI_RATE, TEAM_DEFO_RATE),
    ownerFacetInstance.setAddressAndDistLiquidity(deployer, LIQUIDITY_DEFO_RATE, LIQUIDITY_DAI_RATE),
    ownerFacetInstance.setAddressAndDistTreasury(deployer, TREASURY_DAI_RATE),
    ownerFacetInstance.setAddressDonation(donations, CHARITY_RATE),
    ownerFacetInstance.setAddressVault(vault),
    ownerFacetInstance.setMinRewardTime(SECONDS_IN_A_WEEK),
    ownerFacetInstance.setRewardTax(REWARD_TAX_TABLE),
    ownerFacetInstance.setTaperRate(TAPER_RATE),
    ownerFacetInstance.setGemSettings("0", SAPHIRE_GEM),
    ownerFacetInstance.setGemSettings("1", RUBY_GEM),
    ownerFacetInstance.setGemSettings("2", DIAMOND_GEM),
    // activate limit hours
    ownerFacetInstance.setMintLimitPeriod(MINT_LIMIT_PERIOD),
    // activate maintenance days
    ownerFacetInstance.setMaintenancePeriod(MAINTENANCE_PERIOD),
  ]);

  deploySuccess(`Success`);
};

export default func;
func.tags = ["DiamondConfigured"];
