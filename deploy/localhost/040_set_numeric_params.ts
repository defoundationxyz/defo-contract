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
} from "@config";
import { deployAnnounce, deploySuccess } from "@utils/output.helper";
import { DeployFunction } from "hardhat-deploy/types";

import { OwnerFacet } from "../../types";

const func: DeployFunction = async hre => {
  const { getNamedAccounts, ethers } = hre;
  const { deployer, donations, team, vault } = await getNamedAccounts();

  const ownerFacetInstance = await ethers.getContract<OwnerFacet>("DEFODiamond");

  deployAnnounce("\n\nInitializing OwnerFacet with numeric parameters from  constants/config.ts ...");

  await Promise.all([
    ownerFacetInstance.setAddressAndDistTeam(team, TREASURY_DAI_RATE, TREASURY_DEFO_RATE),
    ownerFacetInstance.setAddressAndDistLiquidity(deployer, LIQUIDITY_DEFO_RATE, LIQUIDITY_DAI_RATE),
    ownerFacetInstance.setAddressDonation(donations, CHARITY_RATE),
    ownerFacetInstance.setAddressVault(vault),
    ownerFacetInstance.setMinRewardTime(MIN_REWARD_TIME),
    ownerFacetInstance.setRewardTax(REWARD_TAX_TABLE),
    ownerFacetInstance.setGemSettings("0", SAPHIRE_GEM),
    ownerFacetInstance.setGemSettings("1", RUBY_GEM),
    ownerFacetInstance.setGemSettings("2", DIAMOND_GEM),
    // activate limit hours
    ownerFacetInstance.setMintLimitHours(MINT_LIMIT_HOURS),
    // activate maintenance days
    ownerFacetInstance.setMaintenanceDays(MAINTENANCE_DAYS),
  ]);

  deploySuccess(`Success`);
};

export default func;
func.tags = ["DiamondConfigured"];
