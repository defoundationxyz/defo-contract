// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.15;

import "./PercentHelper.sol";
import "./LibAppStorage.sol";

/// @notice Library for withdrawal tax operations
library TaxHelper {
    /// @dev gets an index to the taxTable
    /// @param _timeFromLastRewardWithdrawal time in seconds passed from the last claim or stake
    /// @return taxTier_ tax tier, can be a configurable mapping, now it's 0- 100% (rewards have not accrued yet), 1- 30%, 2-30%, 3- 15%, 4-0%.
    function getTaxTier(uint256 _timeFromLastRewardWithdrawal) internal pure returns (TaxTiers taxTier_) {
        taxTier_ = TaxTiers.Tier4NoTax;
        if (_timeFromLastRewardWithdrawal < 4 weeks) taxTier_ = TaxTiers.Tier3SmallTax;
        if (_timeFromLastRewardWithdrawal < 3 weeks) taxTier_ = TaxTiers.Tier2MediumTax;
        if (_timeFromLastRewardWithdrawal < 2 weeks) taxTier_ = TaxTiers.Tier1HugeTax;
        if (_timeFromLastRewardWithdrawal < 1 weeks) taxTier_ = TaxTiers.Tier0NoPayment;
    }

    /// @dev gets an index to taxRates from config
    /// @param _lastRewardWithdrawalTimestamp time in seconds of the last claim or stake to vault
    /// @return timestamp of the next tax tier change
    function wenNextTaxTier(uint32 _lastRewardWithdrawalTimestamp) internal view returns (uint256) {
        if (_lastRewardWithdrawalTimestamp > uint32(block.timestamp)) {
            return 0;
        }
        uint256 _timeFromLastRewardWithdrawal = uint32(block.timestamp) - _lastRewardWithdrawalTimestamp;
        if (_timeFromLastRewardWithdrawal > 4 weeks)
            return 0;
        else
            return _lastRewardWithdrawalTimestamp + 1 weeks;
    }

    /// function retrieves tax rate for given tax tier
    function getTaxRate(TaxTiers _taxTier) internal view returns (uint256) {
        AppStorage storage s = LibAppStorage.diamondStorage();
        return s.config.taxRates[uint256(_taxTier)];
    }
}
