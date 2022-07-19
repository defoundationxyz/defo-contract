// SPDX-License-Identifier-MIT
pragma solidity ^0.8.9;

import {LibGem} from "../LibGem.sol";
import "./PercentHelper.sol";

/// @notice Library to boost rates and fees
/// @author crypt0grapher, Decentralized Foundation
library BoosterHelper {
    /// @notice boosting rewards rate (which is an amount per second), 50% for omega, 25% for delta
    function boostRewardsRate(LibGem.Booster booster, uint256 rate) internal pure returns (uint256) {
        if (booster == LibGem.Booster.Omega) {
            return rate * 15000 / 10000;
            //50% more
        } else if (booster == LibGem.Booster.Delta) {
            return rate * 12500 / 10000;
            //25% more
        } else return rate;
    }

    /// @notice reducing fees, 50% for omega, 25% reduction for delta
    function reduceMaintenanceFee(LibGem.Booster booster, uint256 fee) internal pure returns (uint256) {
        if (booster == LibGem.Booster.Omega) {
            return fee / 2;
        } else if (booster == LibGem.Booster.Delta) {
            return fee * 100 / 75;
        } else return fee;
    }
}
