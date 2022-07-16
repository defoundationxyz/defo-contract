// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

/// @notice Operations with time periods and durations
library TimeHelper {
    function hasPassedFromOrNotHappenedYet(uint256 timeEvent, uint256 lockPeriod) internal view returns (bool) {
        return (timeEvent >  block.timestamp || block.timestamp - timeEvent > lockPeriod);
    }
    function notPassedFromOrNotHappenedYet(uint256 timeEvent, uint256 freePeriod) internal view returns (bool) {
        return (timeEvent >  block.timestamp || block.timestamp - timeEvent < freePeriod);
    }
}