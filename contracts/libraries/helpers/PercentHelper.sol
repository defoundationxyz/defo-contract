// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "../LibMeta.sol";
import "hardhat/console.sol";

/// @notice Library for percentage math
/// @author crypt0grapher, Decentralized Foundation
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
    function invertedPercent(uint256 value, uint256 ratio) internal view returns (uint256) {
        console.log("--invertedPercent");
        console.log("value %s,ratio %s", value, ratio);
        console.log("result", value*HUNDRED_PERCENT / (HUNDRED_PERCENT - ratio));
        return value*HUNDRED_PERCENT / (HUNDRED_PERCENT - ratio);
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
