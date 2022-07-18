import { BigNumber, ethers } from "ethers";

import { LibGem } from "../types/contracts/facets/OwnerFacet";

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

export const REWARD_TAX_TABLE = [percent(100), percent(30), percent(20), percent(10), 0];
export const REWARDS_RELEASE_PERIOD = SECONDS_IN_A_WEEK;

export const weeklyInPerSecond = (value: number | string | BigNumber) => toWei(value).div(SECONDS_IN_A_WEEK);
export const monthlyInPerSecond = (value: number | string | BigNumber) => toWei(value).div(SECONDS_IN_A_MONTH);

export const TREASURY_DEFO_RATE = percent(50);
export const TREASURY_DAI_RATE = percent(HUNDRED_PERCENT) - TREASURY_DEFO_RATE;

///TODO verify since it's zero in the whitepaper
export const TEAM_DEFO_RATE = 0;
export const TEAM_DAI_RATE = 0;

export const LIQUIDITY_DEFO_RATE = percent(50);
export const LIQUIDITY_DAI_RATE = percent(HUNDRED_PERCENT) - LIQUIDITY_DEFO_RATE;

export const CHARITY_RATE = percent(5);

export const MINT_LIMIT_PERIOD = 12 * SECONDS_IN_AN_HOUR;

export const MAINTENANCE_PERIOD = 30 * SECONDS_IN_A_DAY;

export const TAPER_RATE = percent(20);

export const SAPHIRE_GEM: LibGem.GemTypeMetadataStruct = {
  LastMint: 0,
  MaintenanceFee: toWei(1.5),
  RewardRate: toWei(0.29),
  DailyLimit: 32,
  MintCount: "0",
  DefoPrice: toWei(5),
  StablePrice: toWei(25),
  TaperRewardsThreshold: toWei(7.5),
  maintenancePeriod: SECONDS_IN_A_MONTH,
};

export const RUBY_GEM: LibGem.GemTypeMetadataStruct = {
  LastMint: 0,
  MaintenanceFee: toWei(6),
  RewardRate: toWei(1.2),
  DailyLimit: 8,
  MintCount: 0,
  DefoPrice: toWei(20),
  StablePrice: toWei(100),
  TaperRewardsThreshold: toWei(30),
  maintenancePeriod: SECONDS_IN_A_MONTH,
};

export const DIAMOND_GEM: LibGem.GemTypeMetadataStruct = {
  LastMint: 0,
  MaintenanceFee: toWei(24),
  RewardRate: toWei(5),
  DailyLimit: 2,
  MintCount: 0,
  DefoPrice: toWei(80),
  StablePrice: toWei(400),
  TaperRewardsThreshold: toWei(120),
  maintenancePeriod: SECONDS_IN_A_MONTH,
};
