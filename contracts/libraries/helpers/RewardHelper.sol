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
        uint ratePerSecond,
        uint lastRewardTime,
        uint rewardPeriodicity
    ) internal view returns (uint) {
        console.log("-- calculateReward");
        console.log("ratePerSecond ", ratePerSecond);
        console.log("lastRewardTime ", lastRewardTime);
        console.log("block.timestamp ", block.timestamp);
        console.log("block.lastRewardTime ", lastRewardTime);
        console.log("rewardPeriodicity ", rewardPeriodicity);
        console.log("result: ", (block.timestamp > lastRewardTime) ? ((block.timestamp - lastRewardTime)/rewardPeriodicity) * ratePerSecond * rewardPeriodicity : 0);
        return (block.timestamp > lastRewardTime) ? ((block.timestamp - lastRewardTime)/rewardPeriodicity) * ratePerSecond * rewardPeriodicity : 0;
    }

    function applyTaper(
        uint256 rewardAmount,
        uint256 totalPaid,
        uint256 taperThreshold,
        uint256 taperPercent
    ) internal view returns (uint256) {
        while (totalPaid > taperThreshold) {
            rewardAmount -= rewardAmount.rate(taperPercent);
            totalPaid -= taperThreshold;
        }
        return rewardAmount;
    }
}
