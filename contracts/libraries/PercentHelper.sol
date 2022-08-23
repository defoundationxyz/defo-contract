// SPDX-License-Identifier: MIT
pragma solidity 0.8.15;

import "./LibAppStorage.sol";


/**
 * @notice Library for percentage integer math, note PERCENTAGE_PRECISION_MULTIPLIER when configuring the protocol
 * @author Decentralized Foundation Team
 * @dev PERCENTAGE_PRECISION_MULTIPLIER*100 = 10000 greater than real percent, so 20% is represented as 2000, meaning 0.2
 */

library PercentHelper {
    uint256 constant PERCENTAGE_PRECISION_MULTIPLIER = 100;
    uint256 constant HUNDRED_PERCENT = 100 * PERCENTAGE_PRECISION_MULTIPLIER;

    /**
     * @dev simply a ratio of the given value, e.g. if tax is 30% and value if 100 the function gives 30
     * @param value Value to get ratio from
     * @param tax Percent to apply
     */
    ///todo make pure once got rid of the console.log
    function rate(uint256 value, uint256 tax) internal pure returns (uint256) {
        return tax > 0 ? (value * tax) / HUNDRED_PERCENT : 0;
    }

    /**
    * @dev simple gross-up, gives back gross for net value, if charity is 5%, then gross up of 95 gives 100
     * @param netValue Net value to gross up
     * @param tax Percent that was applied
     */
    function grossUp(uint256 netValue, uint256 tax) internal pure returns (uint256) {
        return tax > 0 ? (netValue * HUNDRED_PERCENT) / (HUNDRED_PERCENT - tax) : 0;
    }


    /// @dev received inverted percent for taper calc, if ratio is 20%, then 1/(1-20%) = 25%
    function invertedRate(uint256 value, uint256 ratio) internal pure returns (uint256) {
        return value * HUNDRED_PERCENT / (HUNDRED_PERCENT - ratio);
    }

    function oneHundredLessPercent(uint256 ratio) internal pure returns (uint256) {
        return (HUNDRED_PERCENT - ratio);
    }

    function minusHundredPercent(uint256 ratio) internal pure returns (uint256) {
        return (ratio - HUNDRED_PERCENT);
    }


    function reversePercent(uint256 ratio) internal pure returns (uint256) {
        return PERCENTAGE_PRECISION_MULTIPLIER / ratio;
    }

    function percentPower(uint256 value, uint256 ratio, uint pow) internal pure returns (uint256) {
        return value * PERCENTAGE_PRECISION_MULTIPLIER ** pow / ratio ** pow;
    }


    /// @dev simply value less given percentage, e.g. if tax is 30% the functio gives 70 for 100
    function lessRate(uint256 value, uint256 tax) internal pure returns (uint256) {
        return value - rate(value, tax);
    }

    function plusRate(uint256 value, uint256 tax) internal pure returns (uint256) {
        return value + rate(value, tax);
    }
}
