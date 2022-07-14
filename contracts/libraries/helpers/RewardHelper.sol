// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import {LibGem} from "../LibGem.sol";
import "./PercentHelper.sol";

/// @notice Library for reward calculations
/// @author crypt0grapher, Decentralized Foundation
library RewardHelper {
    using PercentHelper for uint256;
    ///@dev calculate rewards with a second precision
    function calculateReward(uint256 gemPrice, uint256 ratePerSecond, uint256 lastRewardTime) internal view returns (uint256){
        return (block.timestamp - lastRewardTime) * ratePerSecond * gemPrice;
    }

    function applyTaper(uint256 rewardAmount, uint256 totalPaid, uint256 taperThreshold, uint256 taperPercent) internal pure returns (uint256){
        while (totalPaid > taperThreshold) {
            rewardAmount -= rewardAmount.rate(taperPercent);
            totalPaid -= taperThreshold;
        }
        return rewardAmount;
    }


}
