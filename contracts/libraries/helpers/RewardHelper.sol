// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import {LibGem} from "../LibGem.sol";
import {LibMeta} from "../LibMeta.sol";
import "./PercentHelper.sol";
import "hardhat/console.sol";

/// @notice Library for reward calculations
/// @author crypt0grapher, Decentralized Foundation
library RewardHelper {
    using PercentHelper for uint256;

    ///@dev calculate rewards with a second precision
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

    function applyTaper(
        uint256 rewardAmount, //amount to taper
        uint256 totalPaid, //250, 50 vault and all the total including earlier claimed, for percent
        uint256 taperThreshold, //120
        uint256 taperPercent, //20%,
        uint ratePerPeriod, //5
        uint payOrDeductPeriod //1 week
    ) internal view returns (uint256) {
        console.log("-- applyTaper");
        console.log("rewardAmount ", rewardAmount);
        console.log("totalPaid ", totalPaid);
        console.log("taperThreshold ", taperThreshold);
        console.log("taperPercent ", taperPercent);
        uint updatedRate = ratePerPeriod;
        //let's calculate minimal rate to start with we have to apply according to the totalpaid
        while (totalPaid > taperThreshold) {
            console.log("-- Loop cycle with total paid to determine min rate");
            console.log("totalPaid ", totalPaid);
            console.log("updatedRate ", updatedRate);
            totalPaid -= taperThreshold;
            //200-120 = 80, 80-120 = -40
            updatedRate -= updatedRate.rate(taperPercent);
            //5-4,
        }
        console.log("------");
        //now we have a minimal percent in updated rate that we can increase every taper sum
        uint finalAmount = 0;
        do {
            console.log("--Loop cycle for payment calc");
            console.log("rewardAmount ", rewardAmount);
            console.log("finalAmount ", finalAmount);
            console.log("updatedRate ", updatedRate);
            if (rewardAmount > taperThreshold) {
                //200-120 = 80, -40
                finalAmount += (taperThreshold / ratePerPeriod) * updatedRate;
                rewardAmount -= taperThreshold;
                // 120*5
            }
            else {
                finalAmount += (rewardAmount / ratePerPeriod) * updatedRate;
                break;
            }
            updatedRate = updatedRate.invertedPercent(taperPercent);
            //5-4,
        }
        while (rewardAmount > taperThreshold);
        console.log("---- result finalAmount ", finalAmount);
        return finalAmount;
    }
}
