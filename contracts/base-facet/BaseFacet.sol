// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.9;

import "@openzeppelin/contracts/utils/Context.sol";
import {LibDiamond} from "hardhat-deploy/solc_0.8/diamond/libraries/LibDiamond.sol";
import "./2Utils.sol";
import "../libraries/PercentHelper.sol";
import "../libraries/BoosterHelper.sol";
import "../libraries/PeriodicHelper.sol";

/**
 * @title  BaseFacet
 * @author Decentralized Foundation Team
 * @notice BaseFacet is a base contract all facets to inherit, includes cross-facet utils for DEFO functionality
 */
contract BaseFacet is Utils {
    ///todo ensure passing memory array here to the public functions is pretty optimal
    function _getGemIds(address _user) internal view returns (uint256[] memory) {
        uint256 numberOfGems = s.nft.balances[_user];
        uint256[] memory gemIds = new uint256[](numberOfGems);
        for (uint256 i = 0; i < numberOfGems; i++) {
            uint256 gemId = s.nft.ownedTokens[_user][i];
            require(_exists(gemId), "A gem doesn't exists");
            gemIds[i] = gemId;
        }
        return gemIds;
    }

    function _getPendingMaintenanceFee(uint256 _tokenId) public view returns (uint256) {
        Gem memory gem = s.gems[_tokenId];
        GemTypeConfig memory gemType = s.gemTypes[gem.gemTypeId];
        uint32 maintenancePeriod = s.config.maintenancePeriod;

        // time period checks - if it's not necessary or too early
        if (gem.lastMaintenanceTime >= block.timestamp)
            return 0;
        uint32 feePaymentPeriod = uint32(block.timestamp) - gem.lastMaintenanceTime;
        //"Too soon, maintenance fee has not been yet accrued");
        if (feePaymentPeriod <= maintenancePeriod)
            return 0;

        // amount calculation
        uint256 discountedFeeDai = BoosterHelper.reduceMaintenanceFee(gem.booster, gemType.maintenanceFeeDai);
        uint256 feeAmount = PeriodicHelper.calculatePeriodic(discountedFeeDai, feePaymentPeriod, maintenancePeriod);
        return feeAmount;
    }


}
