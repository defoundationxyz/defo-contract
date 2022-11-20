// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.15;

import "./LibAppStorage.sol";
import "./PercentHelper.sol";
import "./BoosterHelper.sol";
import "./PeriodicHelper.sol";

// helper for limit daily mints
library LibMaintainer {
    function _getPendingMaintenanceFee(uint256 _tokenId) internal view returns (uint256) {
        AppStorage storage s = LibAppStorage.diamondStorage();
        Gem storage gem = s.gems[_tokenId];

        // time period checks - if it's not necessary or too early
        if (gem.lastMaintenanceTime >= block.timestamp)
            return 0;
        uint32 feePaymentPeriod = uint32(block.timestamp) - gem.mintTime;
        //"Too soon, maintenance fee has not been yet accrued");
        if (feePaymentPeriod <= s.config.maintenancePeriod)
            return 0;
        // amount calculation
        uint256 discountedFeeDai = BoosterHelper.reduceMaintenanceFee(gem.booster, s.gemTypes2[gem.gemTypeId].maintenanceFeeDai);
        uint256 feeAmount = PeriodicHelper.calculatePeriodicWithReductionTable(discountedFeeDai, s.maintenanceFeeReductionTable, gem.mintTime, s.config.maintenancePeriod);
        //        uint256 feeAmount = PeriodicHelper.calculatePeriodic(discountedFeeDai, gem.mintTime, s.config.maintenancePeriod);
        return feeAmount - gem.maintenanceFeePaid;
    }

}
