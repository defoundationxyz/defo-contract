// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.15;

import "@openzeppelin/contracts/utils/Context.sol";
import {LibDiamond} from "hardhat-deploy/solc_0.8/diamond/libraries/LibDiamond.sol";
import "../data-types/IDataTypes.sol";
import "./B2Utils.sol";
import "../libraries/PercentHelper.sol";
import "../libraries/BoosterHelper.sol";
import "../libraries/PeriodicHelper.sol";

/**
 * @title  BaseFacet
 * @author Decentralized Foundation Team
 * @notice BaseFacet is a base contract all facets to inherit, includes cross-facet utils and  common reusable functions for DEFO Diamond
 */
contract BaseFacet is Utils {

    /* ====================== Modifiers ====================== */

    modifier exists(uint256 _tokenId) {
        _requireExists(_tokenId);
        _;
    }

    modifier onlyGemHolder(uint256 _tokenId) {
        require(s.nft.owners[_tokenId] == _msgSender(), "You don't own this gem");
        _;
    }

    /* ============ Internal Functions ============ */

    function _requireExists(uint256 _tokenId) internal view {
        require(_exists(_tokenId), "ERC721: tokenId is not valid");
    }

    function _exists(uint256 _tokenId) internal view returns (bool) {
        return (s.nft.owners[_tokenId] != address(0));
    }

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

    function _getAllUsers() internal view returns (address[] memory users_) {
        users_ = new address[](s.nft.allTokens.length);
        for (uint256 tokenId = 0; tokenId < s.nft.allTokens.length; tokenId++) {
            users_[tokenId] = s.nft.owners[tokenId];
        }
    }


    function _getPendingMaintenanceFee(uint256 _tokenId) internal view returns (uint256) {
        Gem storage gem = s.gems[_tokenId];

        // time period checks - if it's not necessary or too early
        if (gem.lastMaintenanceTime >= block.timestamp)
            return 0;
        uint32 feePaymentPeriod = uint32(block.timestamp) - gem.lastMaintenanceTime;
        //"Too soon, maintenance fee has not been yet accrued");
        if (feePaymentPeriod <= s.config.maintenancePeriod)
            return 0;

        // amount calculation
        uint256 discountedFeeDai = BoosterHelper.reduceMaintenanceFee(gem.booster, s.gemTypes[gem.gemTypeId].maintenanceFeeDai);
        uint256 feeAmount = PeriodicHelper.calculatePeriodic(discountedFeeDai, gem.lastMaintenanceTime, s.config.maintenancePeriod);
        return feeAmount;
    }

}
