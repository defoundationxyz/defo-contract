// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import { LibGem } from "../LibGem.sol";
import { LibMeta } from "../LibMeta.sol";
import "./PercentHelper.sol";
import "hardhat/console.sol";

/// @notice Library for reward calculations
/// @author crypt0grapher, Decentralized Foundation
library RewardHelper {
    using PercentHelper for uint256;

    ///@dev calculate rewards with a second precision
    function calculateReward(
        uint256 ratePerSecond,
        uint256 lastRewardTime
    ) internal view returns (uint256) {
        console.log("calculateReward");
        console.log("ratePerSecond ", ratePerSecond);
        console.log("lastRewardTime ", lastRewardTime);
        console.log("timePeriod ", block.timestamp - lastRewardTime);
        console.log("result: ", (block.timestamp - lastRewardTime) * ratePerSecond);
        return (block.timestamp - lastRewardTime) * ratePerSecond;
    }

    function applyTaper(
        uint256 rewardAmount,
        uint256 totalPaid,
        uint256 taperThreshold,
        uint256 taperPercent
    ) internal pure returns (uint256) {
        while (totalPaid > taperThreshold) {
            rewardAmount -= rewardAmount.rate(taperPercent);
            totalPaid -= taperThreshold;
        }
        return rewardAmount;
    }
}
