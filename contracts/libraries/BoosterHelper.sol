// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.15;

import {Booster} from "../data-types/IDataTypes.sol";
import "./PercentHelper.sol";

/// @notice Library to boost rates and fees
/// @author Decentralized Foundation
///todo utilize percenthelper
library BoosterHelper {
    /// @notice boosting rewards rate (which is an amount per second), 50% for omega, 25% for delta
    function boostRewardsRate(Booster booster, uint256 rate) internal pure returns (uint256) {
        if (booster == Booster.Omega) {
            //50% more
            return rate * 15000 / 10000;
        } else if (booster == Booster.Delta) {
            //25% more
            return rate * 12500 / 10000;
        } else return rate;
    }

    /// @notice reducing fees, 50% for omega, 25% reduction for delta
    function reduceMaintenanceFee(Booster booster, uint256 fee) internal pure returns (uint256) {
        if (booster == Booster.Omega) {
            return fee / 2;
        } else if (booster == Booster.Delta) {
            return fee * 7500 / 10000;
        } else return fee;
    }

    function reduceVaultWithdrawalFee(Booster booster, uint256 fee) internal pure returns (uint256) {
        if (booster == Booster.Omega) {
            return fee * 1000 / 10000;
        } else if (booster == Booster.Delta) {
            return fee / 2;
        } else return fee;
    }
}
