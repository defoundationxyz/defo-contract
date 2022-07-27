// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "./PercentHelper.sol";
import "hardhat/console.sol";

/// @notice Library for reward calculations
/// @author Decentralized Foundation
library PeriodicHelper {
    using PercentHelper for uint256;

    /// @dev calculates rewards with a second precision, not prorated to date
    function calculatePeriodic(
        uint ratePerPeriod,
        uint lastEventTime,
        uint payOrDeductPeriod
    ) internal view returns (uint) {
        console.log("-- calculateReward");
        console.log("ratePerPeriod ", ratePerPeriod);
        console.log("lastEventTime ", lastEventTime);
        console.log("lastEventTime ", lastEventTime);
        console.log("block.timestamp ", block.timestamp);
        console.log("block.timestamp - lastEventTime (0 if neg): ", (block.timestamp > lastEventTime) ? (block.timestamp - lastEventTime) : 0);
        console.log("rewardPeriodicity ", payOrDeductPeriod);
        console.log("result: ", (block.timestamp > lastEventTime) ? ((block.timestamp - lastEventTime) / payOrDeductPeriod) * ratePerPeriod : 0);
        return (block.timestamp > lastEventTime) ? ((block.timestamp - lastEventTime) / payOrDeductPeriod) * ratePerPeriod : 0;
    }
}
