// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "./PercentHelper.sol";

/// @notice Library for withdrawal tax operations
library TaxHelper {
    /// @dev these tiers correspond to the configurable percentage from the diamond storage
    enum TaxTier {
        TIER1_HUGE_TAX,
        TIER2_MEDIUM_TAX,
        TIER3_SMALL_TAX,
        NO_TAX
    }

    /// @dev gets an index to RewardTaxTable from LibMeta.DiamondStorage
    /// @param timeFromLastRewardWithdrawal time in seconds passed from the last claim or stake
    /// @return tax tier, can be a configurable mapping, now it's 0- 30%, 1-20%, 2- 10%, 3-0%.
    function getTaxTier(uint256 timeFromLastRewardWithdrawal) internal view returns (TaxTier) {
        TaxTier _taxTier = TaxTier.NO_TAX;
        if (timeFromLastRewardWithdrawal < 4 weeks) {
            if (timeFromLastRewardWithdrawal < 3 weeks) _taxTier = TaxTier.TIER3_SMALL_TAX;
            if (timeFromLastRewardWithdrawal < 2 weeks) _taxTier = TaxTier.TIER2_MEDIUM_TAX;
            if (timeFromLastRewardWithdrawal < 1 weeks) _taxTier = TaxTier.TIER1_HUGE_TAX;
        }
        return _taxTier;
    }

    /// @dev gets an index to RewardTaxTable from LibMeta.DiamondStorage
    /// @param LastRewardWithdrawalTimestamp time in seconds of the last claim or stake to vault
    /// @return timestamp of the next tax tier change
    function wenNextTaxTier(uint256 LastRewardWithdrawalTimestamp) internal view returns (uint256) {
        uint256 _timeFromLastRewardWithdrawal = block.timestamp - LastRewardWithdrawalTimestamp;
        require(_timeFromLastRewardWithdrawal < 4 weeks);
        return LastRewardWithdrawalTimestamp + 1 weeks;
    }

    /// function retrieves tax rate for given tax tier
    function getTaxRate(TaxTier taxTier) internal view returns (uint256) {
        LibMeta.DiamondStorage storage metaDiamondStorage = LibMeta.diamondStorage();
        return metaDiamondStorage.RewardTaxTable[uint256(taxTier)];
    }
}
