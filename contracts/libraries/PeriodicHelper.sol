// SPDX-License-Identifier: MIT
pragma solidity 0.8.15;

import "./PercentHelper.sol";
import "./BoosterHelper.sol";
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
    ) internal view returns (uint) {
        return calculatePeriodicToDate(ratePerPeriod, lastEventTime, uint32(block.timestamp), payOrDeductPeriod);
    }



    // @notice Calculated Tapered Reward starting from the mint time. To get the reward call this function and subtract already paid from it.
    // @return taperedReward, updatedRewardRate
    function calculateTaperedRewardAndRate(
        uint timePeriod, //block.timestamp - mintTime
        uint256 taperThreshold, //120 for diamond
        uint256 taperPercent, //80% usually, NOTE this is 80% but not 20%
        uint ratePerPeriod, //5 for diamond
        uint payOrDeductPeriod //in seconds, initially it's 1 week
    ) internal view returns (uint taperedReward, uint updatedRewardRate) {
//        console.log("-- calcTaperedReward");
//        console.log("timePeriod ", timePeriod);
//        console.log("taperThreshold ", taperThreshold);
//        console.log("taperPercent ", taperPercent);
//        console.log("ratePerPeriod ", ratePerPeriod);
//        console.log("payOrDeductPeriod ", payOrDeductPeriod);
        uint256 taperedPercent = taperPercent.oneHundredLessPercent();
        // Basically it's a geometric progression of the timestamps b_n = b_1*q_(n-1),
        // For simplicity startTime is zero, so timePeriod should be block.timestamp - startTime
        // where q = 1/taperedPercent, b_1 =  taperThreshold/ratePerPeriod
        // So that b_0 = taperThreshold/ratePerPeriod (which is 120/5= 24 weeks for the first taper from the startTime)
        // b_1 = taperThreshold/(ratePerPeriod*taperedPercent^1)  (which is 120/(5*0.8)= 30 weeks from the previous point to get 120 $DEFO by the tapered rate of 4)
        // b_2 = taperThreshold/(ratePerPeriod*taperedPercent^2)
        // ....
        // b_n = taperThreshold/(ratePerPeriod  *taperedPercent^n)
        // b_(n+1) = taperThreshold/(ratePerPeriod*taperedPercent^(n+1))
        // So that SUM_n_from_1_to_n(b_n)<=timePeriod, but SUM_n_from_1_to_(n+1)(b_n)>timePeriod
        // Actual points on the timeline are S_i which are sums of the taper intervals b_i
        //
        // 1. At first, lets' find n and S_n
        // Sum of geometric progression is Sn = b_1 * (q^n-1)/(q-1)
        // So we just loop to find while Sn<=timePeriod, so that Sn = taperThreshold/ratePerPeriod * (1/taperedPercent^n-1)/(1/taperedPercent -1)
        //
        // for example, for diamond gem: it's 120/5*(1/0.8**(N-1)-1)/(1/0.8-1)
        //
        // 2. Once we found n and S_n, the amount to pay would be taperThreshold*n+(timePeriod - S_n)*ratePerPeriod*taperedPercent^n
        // for example. if we got 100 weeks, n =3 and the formula is 120*3+(100-91.5)*5*0.8**3 = 381.76
        // We calculate the finalAmount and deduct what was paid already to calculate the payment.
        uint finalAmount;
        uint sN = 0;
        uint sNp1 = 0;
        //S_(n+1)
        uint n = 0;
        do {
            //this is the formula, but the percents are with precision multiplier
            //sN = taperThreshold/ratePerPeriod * (1/taperedPercent**n-1)/(1/taperedPercent -1);
            sN = sNp1;
            sNp1 = taperThreshold / ratePerPeriod *
            (PercentHelper.PERCENTAGE_PRECISION_MULTIPLIER * PercentHelper.HUNDRED_PERCENT ** n / taperedPercent ** n - PercentHelper.PERCENTAGE_PRECISION_MULTIPLIER) /
            (PercentHelper.PERCENTAGE_PRECISION_MULTIPLIER * PercentHelper.HUNDRED_PERCENT / taperedPercent - PercentHelper.PERCENTAGE_PRECISION_MULTIPLIER);
            n++;
//            console.log("loop, n=%s, sN=%s, sNp1=%s", n, sN, sNp1);
        }
        while (payOrDeductPeriod * sNp1 <= timePeriod);
        n = n - 2;
        //convert sN to Seconds, that's just for the logs to show in weeks
        sN *= payOrDeductPeriod;
//        console.log("n= %s, sN = %s", n, sN);
        //        uint bN = payOrDeductPeriod * taperThreshold / (ratePerPeriod * taperedPercent ** n);
        //        console.log("bN= ", bN);
        // The whole process makes sense if the current time is later than the 1st taper event
        uint finalRate;
        if (sN != 0 && timePeriod > sN) {
//            console.log("(timePeriod - sN)", (timePeriod - sN));
//            console.log("(timePeriod - sN) / payOrDeductPeriod", (timePeriod - sN) / payOrDeductPeriod);
//            console.log("taperThreshold * n", taperThreshold * n);
            finalRate = ratePerPeriod * taperedPercent ** (n + 1) / PercentHelper.HUNDRED_PERCENT ** (n + 1);
            finalAmount = taperThreshold * n + ((timePeriod - sN) / payOrDeductPeriod) * finalRate;
        }
        else {
            finalRate = ratePerPeriod;
            finalAmount = timePeriod / payOrDeductPeriod * ratePerPeriod;
        }
//        console.log("---- result finalAmount %s", finalAmount);
        return (finalAmount, finalRate);
    }

    // @notice Calculated Tapered Reward starting from the mint time. To get the reward call this function and subtract already paid from it.
    // @return taperedReward, updatedRewardRate
    function calculateTaperedRewardWithIntermediateBoost(
        uint timePeriod, //block.timestamp - mintTime
        uint256 taperThreshold, //120 for diamond
        uint256 taperPercent, //80% usually, NOTE this is 80% but not 20%
        uint ratePerPeriod, //5 for diamond
        Booster booster, //booster to boost the tapered rate at the right moment
        uint unboostedPeriod, // boost moment starting from zero, e.g. boost moment less mint date
        uint payOrDeductPeriod //in seconds, initially it's 1 week
    ) internal view returns (uint) {
        require(unboostedPeriod < timePeriod, "boost moment is earlier than mint time");
        /// todo This is not very precise, some discrepancies may happen since the boosted taper is calculated fromt he boost moment not cosidered the part of the current taper timeframe when that boost happen, so the part of the curret taper period is lost in the moment of boost, in favor of the user
        (uint unboostedAmount, uint unboostedRate) = calculateTaperedRewardAndRate(unboostedPeriod, taperThreshold, taperPercent, ratePerPeriod, payOrDeductPeriod);
        uint boostedPeriod = timePeriod - unboostedPeriod;
        uint boostedRate = BoosterHelper.boostRewardsRate(booster, unboostedRate);
        (uint boostedAmount, ) = calculateTaperedRewardAndRate(boostedPeriod, taperThreshold, taperPercent, boostedRate, payOrDeductPeriod);
        return boostedAmount + unboostedAmount;
    }
}
