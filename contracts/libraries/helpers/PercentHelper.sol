// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "../LibMeta.sol";

/// @notice Library for percentage math
/// @author crypt0grapher, Decentralized Foundation
library PercentHelper {
    uint256 constant PERCENTAGE_PRECISION_MULTIPLIER = 100;
    uint256 constant HUNDRED_PERCENT = 100 * PERCENTAGE_PRECISION_MULTIPLIER;

    /// @dev simply value less given percentage, e.g., e.g. if tax is 30% the functio gives 70 for 100
    function rate(uint256 value, uint256 tax) internal pure returns (uint256) {
        if (tax > 0) return (value * tax) / HUNDRED_PERCENT;
        else return 0;
    }

    function lessRate(uint256 value, uint256 tax) internal pure returns (uint256) {
        return value - rate(value, tax);
    }

    function plusRate(uint256 value, uint256 tax) internal pure returns (uint256) {
        return value + rate(value, tax);
    }
}
