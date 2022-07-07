import { ethers } from "hardhat";

import { LibGem } from "../types/contracts/facets/OwnerFacet";

export const REWARD_TIME = 3600 * 24 * 7;

export const TREASURY_DEFO_RATE = 50;
export const TREASURY_DAI_RATE = 50;

export const LIQUIDITY_DEFO_RATE = 50;
export const LIQUIDITY_DAI_RATE = 50;

export const CHARITY_RATE = 5;

export const MINT_LIMIT_HOURS = "12";

export const REWARD_TAX_TABLE = ["500", "300", "100", "0"];

export const SAPHIRE_GEM: LibGem.GemTypeMetadataStruct = {
  LastMint: "0",
  MaintenanceFee: "50000000000000000", // daily fee
  RewardRate: "88",
  DailyLimit: "32",
  MintCount: "0",
  DefoPrice: ethers.utils.parseEther("5"),
  StablePrice: ethers.utils.parseEther("25"),
};

export const RUBY_GEM: LibGem.GemTypeMetadataStruct = {
  LastMint: "0",
  MaintenanceFee: "200000000000000000",
  RewardRate: "85", // 85.71
  DailyLimit: "8",
  MintCount: "0",
  DefoPrice: ethers.utils.parseEther("20"),
  StablePrice: ethers.utils.parseEther("100"),
};

export const DIAMOND_GEM: LibGem.GemTypeMetadataStruct = {
  LastMint: "0",
  MaintenanceFee: "800000000000000000",
  RewardRate: "89", // 89.29
  DailyLimit: "2",
  MintCount: "0",
  DefoPrice: ethers.utils.parseEther("80"),
  StablePrice: ethers.utils.parseEther("400"),
};
