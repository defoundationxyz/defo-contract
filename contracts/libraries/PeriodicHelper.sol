// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.15;

import "./PercentHelper.sol";
import "./BoosterHelper.sol";
import "../data-types/IDataTypes.sol";

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

    /// @dev calculates rewards with a second precision, not prorated to date
    function calculatePeriodicWithReductionTable(
        uint256 ratePerPeriod,
        MaintenanceFeeReductionRecord[] storage reduction,
        uint32 lastEventTime,
        uint32 payOrDeductPeriod
    ) internal view returns (uint) {
        uint i = 0;
        uint amount = 0;
        uint32 toDate = lastEventTime + payOrDeductPeriod;
        while (toDate < uint32(block.timestamp)) {
            while (i < reduction.length && reduction[i].timeOfReduction < toDate) {
                i++;
            }
            i--;
            uint rate = ratePerPeriod.rate(reduction[i].maintenanceReductionPercent);
            amount += rate;
            toDate += payOrDeductPeriod;
        }
        return amount;
    }

    // @notice Calculated Tapered Reward starting from the mint time. To get the reward call this function and subtract already paid from it.
    // @return taperedReward, updatedRewardRate
    function calculateTaperedReward(
        uint timePeriod, //block.timestamp - mintTime
        uint256 taperThreshold, //120 for diamond
        uint256 taperPercent, //80% usually, NOTE this is 80% but not 20%
        uint ratePerPeriod, //5 for diamond, pass already boosted rate if boost is applicable
        uint payOrDeductPeriod //in seconds, initially it's 1 week
    ) internal pure returns (uint256 taperedReward) {
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
        }
        while (payOrDeductPeriod * sNp1 <= timePeriod);
        n = n - 2;
        //convert sN to Seconds, that's just for the logs to show in weeks
        sN *= payOrDeductPeriod;
        //        uint bN = payOrDeductPeriod * taperThreshold / (ratePerPeriod * taperedPercent ** n);
        // The whole process makes sense if the current time is later than the 1st taper event
        uint finalRate;
        if (sN != 0 && timePeriod > sN) {
            finalRate = ratePerPeriod * taperedPercent ** (n) / PercentHelper.HUNDRED_PERCENT ** (n);
            finalAmount = taperThreshold * n + ((timePeriod - sN) / payOrDeductPeriod) * finalRate;
        }
        else {
            finalRate = ratePerPeriod;
            finalAmount = timePeriod / payOrDeductPeriod * ratePerPeriod;
        }
        return finalAmount;
    }
}
