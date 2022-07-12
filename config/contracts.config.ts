import { LibGem } from "../types/contracts/facets/OwnerFacet";

export type GemNames = "sapphire" | "ruby" | "diamond";

export const DEFO_TOKEN_TOTAL_SUPPLY = 1e6;
export const DEFO_TOKEN_REWARD_POOL = 875_000;
export const DEFO_TOKEN_TREASURY = 100_000;
export const DEFO_TOKEN_LIQUIDITY_POOL = DEFO_TOKEN_TOTAL_SUPPLY - DEFO_TOKEN_REWARD_POOL - DEFO_TOKEN_TREASURY;

export const GEMS: Record<GemNames, number> = {
  sapphire: 0,
  ruby: 1,
  diamond: 2,
};
export const gemName = (gemNumber: number) =>
  (Object.keys(GEMS) as Array<GemNames>).find(key => GEMS[key] === gemNumber);

const HUNDRED_PERCENT = 100;

export const MIN_REWARD_TIME = 3600 * 24 * 7;

export const TREASURY_DEFO_RATE = 50;
export const TREASURY_DAI_RATE = HUNDRED_PERCENT - TREASURY_DEFO_RATE;

export const LIQUIDITY_DEFO_RATE = 50;
export const LIQUIDITY_DAI_RATE = HUNDRED_PERCENT - LIQUIDITY_DEFO_RATE;

export const CHARITY_RATE = 5;

export const MINT_LIMIT_HOURS = "12";

export const MAINTENANCE_DAYS = "30";

export const REWARD_TAX_TABLE = ["500", "300", "100", "0"];

export const SAPHIRE_GEM: LibGem.GemTypeMetadataStruct = {
  LastMint: "0",
  MaintenanceFee: "50000000000000000", // daily fee
  RewardRate: "88",
  DailyLimit: "32",
  MintCount: "0",
  DefoPrice: (5 * 1e18).toString(),
  StablePrice: (25 * 1e18).toString(),
};

export const RUBY_GEM: LibGem.GemTypeMetadataStruct = {
  LastMint: "0",
  MaintenanceFee: "200000000000000000",
  RewardRate: "85", // 85.71
  DailyLimit: "8",
  MintCount: "0",
  DefoPrice: (20 * 1e18).toString(),
  StablePrice: (100 * 1e18).toString(),
};

export const DIAMOND_GEM: LibGem.GemTypeMetadataStruct = {
  LastMint: "0",
  MaintenanceFee: "800000000000000000",
  RewardRate: "89", // 89.29
  DailyLimit: "2",
  MintCount: "0",
  DefoPrice: (80 * 1e18).toString(),
  StablePrice: (400 * 1e18).toString(),
};
