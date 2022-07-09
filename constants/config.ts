import { LibGem } from "../types/contracts/facets/OwnerFacet";

export type GemNames = "sapphire" | "ruby" | "diamond";

export const gems: Record<GemNames, number> = {
  sapphire: 0,
  ruby: 1,
  diamond: 2,
};
export const gemName = (gemNumber: number) =>
  (Object.keys(gems) as Array<GemNames>).find(key => gems[key] === gemNumber);

export const MIN_REWARD_TIME = 3600 * 24 * 7;

export const TREASURY_DEFO_RATE = 50;
export const TREASURY_DAI_RATE = 50;

export const LIQUIDITY_DEFO_RATE = 50;
export const LIQUIDITY_DAI_RATE = 50;

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
