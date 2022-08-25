import { GEM_TYPES_CONFIG, HUNDRED_PERCENT, PROTOCOL_CONFIG } from "@config";
import { BigNumber } from "ethers";

export const BOOSTERS = [
  {
    name: "DELTA",
    id: 1,
    rewardsBoost: (reward: BigNumber) => reward.mul(125).div(100),
    maintenanceFeeReduction: 0.75,
    vaultFeeReduction: (unstakeFee: number) => unstakeFee / 2,
  },
  {
    name: "OMEGA",
    id: 2,
    rewardsBoost: (reward: BigNumber) => reward.mul(150).div(100),
    maintenanceFeeReduction: 0.5,
    vaultFeeReduction: (unstakeFee: number) => (unstakeFee * 10) / 100,
  },
];

export const testAmountToClaim = (gemTypeId: number) => GEM_TYPES_CONFIG[gemTypeId].rewardAmountDefo as BigNumber;
export const testAmountToStake = testAmountToClaim;
export const testAmountTax = (gemTypeId: number, taxTier: number) =>
  testAmountToClaim(gemTypeId)
    .mul(<number>PROTOCOL_CONFIG.taxRates[taxTier])
    .div(HUNDRED_PERCENT);
export const testAmountCharity = (gemTypeId: number) =>
  testAmountToClaim(gemTypeId)
    .mul(<number>PROTOCOL_CONFIG.charityContributionRate)
    .div(HUNDRED_PERCENT);

export const testAmountClaimed = (gemTypeId: number, taxTier: number) =>
  testAmountToClaim(gemTypeId).sub(testAmountCharity(gemTypeId)).sub(testAmountTax(gemTypeId, taxTier));

export const testAmountStaked = (amountToStake: BigNumber) =>
  amountToStake.mul(HUNDRED_PERCENT - <number>PROTOCOL_CONFIG.charityContributionRate).div(HUNDRED_PERCENT);

export const testAmountUnStaked = (amount: BigNumber, withdrawReductor: (fee: number) => number = fee => fee) =>
  amount.mul(HUNDRED_PERCENT - withdrawReductor(<number>PROTOCOL_CONFIG.vaultWithdrawalTaxRate)).div(HUNDRED_PERCENT);
