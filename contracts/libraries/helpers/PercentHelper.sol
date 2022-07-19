// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "../LibMeta.sol";
import "hardhat/console.sol";

/// @notice Library for percentage math
/// @author crypt0grapher, Decentralized Foundation
/// @dev percents in the solution PERCENTAGE_PRECISION_MULTIPLIER*100 = 10000 greater than real percent, so 20% is represented as 2000, meaning that 0.2

library PercentHelper {
    uint256 constant PERCENTAGE_PRECISION_MULTIPLIER = 100;
    uint256 constant HUNDRED_PERCENT = 100 * PERCENTAGE_PRECISION_MULTIPLIER;

    /// @dev simply a ratio, e.g.if tax is 30% the function gives 30 for 100
    function rate(uint256 value, uint256 tax) internal view returns (uint256) {
        console.log("--rate helper");
        console.log("rate, got value %s, rate %s", value, tax);
        console.log("return ", tax > 0 ? (value * tax) / HUNDRED_PERCENT : 0);
        return tax > 0 ? (value * tax) / HUNDRED_PERCENT : 0;
    }

    /// @dev received inverted percent for taper calc, if ratio is 20%, then 1/(1-20%) = 25%
    function invertedRate(uint256 value, uint256 ratio) internal view returns (uint256) {
        console.log("--invertedPercent");
        console.log("value %s,ratio %s", value, ratio);
        console.log("result", value*HUNDRED_PERCENT / (HUNDRED_PERCENT - ratio));
        return value*HUNDRED_PERCENT / (HUNDRED_PERCENT - ratio);
    }

    function oneHundredLessPercent(uint256 ratio) internal view returns (uint256) {
        return (HUNDRED_PERCENT - ratio);
    }

    function minusHundredPercent(uint256 ratio) internal view returns (uint256) {
        return (ratio- HUNDRED_PERCENT);
    }


    function reversePercent(uint256 ratio) internal view returns (uint256) {
        return PERCENTAGE_PRECISION_MULTIPLIER/ratio;
    }

    function procentPower(uint256 value, uint256 ratio, uint pow) internal view returns (uint256) {
        return value*PERCENTAGE_PRECISION_MULTIPLIER**pow/ratio**pow;
    }


    /// @dev simply value less given percentage, e.g. if tax is 30% the functio gives 70 for 100
    function lessRate(uint256 value, uint256 tax) internal view returns (uint256) {
        console.log("--lessRate helper");
        console.log("got value %s, tax %s", value, tax);
        console.log("return", value - rate(value, tax));
        return value - rate(value, tax);
    }

    function plusRate(uint256 value, uint256 tax) internal view returns (uint256) {
        console.log("plusRate, got value %s, tax %s", value, tax);
        return value + rate(value, tax);
    }
}
