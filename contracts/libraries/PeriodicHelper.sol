// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "./PercentHelper.sol";
import "hardhat/console.sol";

/// @notice Library for reward calculations
/// @author Decentralized Foundation
library PeriodicHelper {
    using PercentHelper for uint256;

    /// @dev calculates rewards with a second precision to a given date, not prorated to date
    function calculatePeriodicToDate(
        uint256 ratePerPeriod,
        uint32 lastEventTime,
        uint32 toDate,
        uint32 payOrDeductPeriod
    ) internal pure returns (uint) {
        return (toDate > lastEventTime) ? ((toDate - lastEventTime) / payOrDeductPeriod) * ratePerPeriod : 0;
    }

    /// @dev calculates rewards with a second precision, not prorated to date
    function calculatePeriodic(
        uint256 ratePerPeriod,
        uint32 lastEventTime,
        uint32 payOrDeductPeriod
    ) internal pure returns (uint) {
        return (uint32(block.timestamp) > lastEventTime) ? ((uint32(block.timestamp) - lastEventTime) / payOrDeductPeriod) * ratePerPeriod : 0;
    }
}
