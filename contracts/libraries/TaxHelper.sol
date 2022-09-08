// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.15;

import "./PercentHelper.sol";
import "./LibAppStorage.sol";

/// @notice Library for withdrawal tax operations
library TaxHelper {
    /// @dev gets an index to the taxTable
    /// @param _timeFromLastRewardWithdrawal time in seconds passed from the last claim or stake
    /// @return taxTier_ tax tier, can be a configurable mapping, now it's 0- 100% (rewards have not accrued yet), 1- 30%, 2-30%, 3- 15%, 4-0%.
    function getTaxTier(uint256 _timeFromLastRewardWithdrawal) internal view returns (TaxTiers taxTier_) {
        AppStorage storage s = LibAppStorage.diamondStorage();
        uint32 scale = s.config.taxScaleSinceLastClaimPeriod;

        taxTier_ = TaxTiers.Tier4NoTax;
        if (_timeFromLastRewardWithdrawal < scale * 4) taxTier_ = TaxTiers.Tier3SmallTax;
        if (_timeFromLastRewardWithdrawal < scale * 3) taxTier_ = TaxTiers.Tier2MediumTax;
        if (_timeFromLastRewardWithdrawal < scale * 2) taxTier_ = TaxTiers.Tier1HugeTax;
        if (_timeFromLastRewardWithdrawal < scale * 1) taxTier_ = TaxTiers.Tier0NoPayment;
    }

    /// @dev gets an index to taxRates from config
    /// @param _lastRewardWithdrawalTimestamp time in seconds of the last claim or stake to vault
    /// @return timestamp of the next tax tier change
    function wenNextTaxTier(uint32 _lastRewardWithdrawalTimestamp) internal view returns (uint256) {
        AppStorage storage s = LibAppStorage.diamondStorage();
        uint32 scale = s.config.taxScaleSinceLastClaimPeriod;

        if (_lastRewardWithdrawalTimestamp > uint32(block.timestamp)) {
            return 0;
        }
        uint256 _timeFromLastRewardWithdrawal = uint32(block.timestamp) - _lastRewardWithdrawalTimestamp;
        if (_timeFromLastRewardWithdrawal > scale * 4)
            return 0;
        else
            return _lastRewardWithdrawalTimestamp + scale;
    }

    /// function retrieves tax rate for given tax tier
    function getTaxRate(TaxTiers _taxTier) internal view returns (uint256) {
        AppStorage storage s = LibAppStorage.diamondStorage();
        return s.config.taxRates[uint256(_taxTier)];
    }
}
