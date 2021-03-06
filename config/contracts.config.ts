import { MAINNET_DAI_ADDRESS } from "@constants/addresses";
import { GemTypeConfigStruct, ProtocolConfigStruct } from "@contractTypes/contracts/interfaces/IConfig";
import { strict } from "assert";
import { BigNumber, ethers } from "ethers";

export type GemNames = "sapphire" | "ruby" | "diamond";

export const DEFO_TOKEN_TOTAL_SUPPLY = 1e6;
export const DEFO_TOKEN_REWARD_POOL = 875_000;
export const DEFO_TOKEN_TREASURY = 115_000;
export const DEFO_TOKEN_LIQUIDITY_POOL = DEFO_TOKEN_TOTAL_SUPPLY - DEFO_TOKEN_REWARD_POOL - DEFO_TOKEN_TREASURY;

export const toWei = (value: number | string | BigNumber) => ethers.utils.parseEther(value.toString());

export const GEMS: Record<GemNames, number> = {
  sapphire: 0,
  ruby: 1,
  diamond: 2,
};
export const gemName = (gemNumber: number) =>
  (Object.keys(GEMS) as Array<GemNames>).find(key => GEMS[key] === gemNumber);

const HUNDRED_PERCENT = 100;
const PERCENTAGE_PRECISION_MULTIPLIER = 100;
const percent = (value: number) => value * PERCENTAGE_PRECISION_MULTIPLIER;

export const SECONDS_IN_AN_HOUR = 3600;
export const SECONDS_IN_A_DAY = SECONDS_IN_AN_HOUR * 24;
export const SECONDS_IN_A_WEEK = SECONDS_IN_A_DAY * 7;
export const SECONDS_IN_A_MONTH = 30.44 * SECONDS_IN_A_DAY;

export const weeklyInPerSecond = (value: number | string | BigNumber) => toWei(value).div(SECONDS_IN_A_WEEK);
export const monthlyInPerSecond = (value: number | string | BigNumber) => toWei(value).div(SECONDS_IN_A_MONTH);

export const TREASURY_DAI_RATE = percent(75);
export const TREASURY_DEFO_RATE = 0;

export const REWARD_DAI_RATE = 0;
export const REWARD_DEFO_RATE = percent(75);

export const LIQUIDITY_DAI_RATE = percent(25);
export const LIQUIDITY_DEFO_RATE = percent(25);

strict(percent(HUNDRED_PERCENT) === LIQUIDITY_DAI_RATE + REWARD_DAI_RATE + TREASURY_DAI_RATE);
strict(percent(HUNDRED_PERCENT) === TREASURY_DEFO_RATE + REWARD_DEFO_RATE + LIQUIDITY_DEFO_RATE);

export const MINT_LIMIT_PERIOD = 12 * SECONDS_IN_AN_HOUR;

export const MAINTENANCE_PERIOD = 30 * SECONDS_IN_A_DAY;

// the order for wallets, paymentTokens is extremely important, which is also the same in incomeDistributionOnMint
enum PaymentTokens {
  Dai,
  Defo,
}

// paymentTokens: DAI goes first, DEFO goes second.
// wallets:
enum Wallets {
  Treasury,
  RewardPool,
  LiquidityPair,
  Team,
  Charity,
  Vault,
  RedeemContract,
}

enum TaxTiers {
  Tier0NoPayment,
  Tier1HugeTax,
  Tier2MediumTax,
  Tier3SmallTax,
  Tier4NoTax,
}

//====== Protocol Config ========

export const PROTOCOL_CONFIG: Omit<ProtocolConfigStruct, "paymentTokens" | "wallets"> = {
  // export const PROTOCOL_CONFIG: Omit<ProtocolConfigDTOStruct, "paymentTokens" | "wallets"> = {
  //   add paymentTokens and wallets once deployed
  incomeDistributionOnMint: [
    //DAI distribution
    [
      //Treasury,
      TREASURY_DAI_RATE,
      //   RewardPool,
      REWARD_DAI_RATE,
      //   LiquidityPair,
      LIQUIDITY_DAI_RATE,
    ],
    //DEFO distribution
    [
      //Treasury,
      TREASURY_DEFO_RATE,
      //   RewardPool,
      REWARD_DEFO_RATE,
      //   LiquidityPair,
      LIQUIDITY_DEFO_RATE,
    ],
  ],
  maintenancePeriod: SECONDS_IN_A_MONTH,
  rewardPeriod: SECONDS_IN_A_WEEK,
  taxScaleSinceLastClaimPeriod: SECONDS_IN_A_WEEK,
  taxRates: [percent(100), percent(30), percent(30), percent(15), 0],
  charityContributionRate: percent(5),
  vaultWithdrawalTaxRate: percent(10),
  taperRate: percent(20),
  mintLock: false,
  transferLock: false,
  mintLimitWindow: 12 * SECONDS_IN_AN_HOUR,
};

//====== Gem Types Config ========

//note in price DAI goes first, DEFO goes second
export const SAPHIRE_GEM: GemTypeConfigStruct = {
  maintenanceFeeDai: toWei(1.5),
  rewardAmountDefo: toWei(0.29),
  price: [toWei(25), toWei(5)],
  taperRewardsThresholdDefo: toWei(7.5),
  maxMintsPerLimitWindow: 32,
};

export const RUBY_GEM: GemTypeConfigStruct = {
  maintenanceFeeDai: toWei(6),
  rewardAmountDefo: toWei(1.2),
  price: [toWei(100), toWei(20)],
  taperRewardsThresholdDefo: toWei(30),
  maxMintsPerLimitWindow: 8,
};

export const DIAMOND_GEM: GemTypeConfigStruct = {
  maintenanceFeeDai: toWei(24),
  rewardAmountDefo: toWei(5),
  price: [toWei(400), toWei(80)],
  taperRewardsThresholdDefo: toWei(120),
  maxMintsPerLimitWindow: 2,
};

export const GEM_TYPES_CONFIG = [SAPHIRE_GEM, RUBY_GEM, DIAMOND_GEM];
