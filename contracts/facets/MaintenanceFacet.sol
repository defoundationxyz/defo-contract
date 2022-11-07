// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.15;

import "../data-types/IDataTypes.sol";
import "../interfaces/IMaintenance.sol";
import "../libraries/LibMaintainer.sol";
import "../base-facet/BaseFacet.sol";

/** @title  ERC721Facet EIP-2535 Diamond Facet
  * @author Decentralized Foundation Team
  * @notice The Contract uses diamond storage providing functionality of ERC721, ERC721Enumerable, ERC721Burnable, ERC721Pausable
*/
contract MaintenanceFacet is BaseFacet, IMaintenance {
    /* ====================== Modifiers ====================== */
    modifier onlyRedeemContract() {
        require(
            s.config.wallets[uint(Wallets.Stabilizer)] == _msgSender() ||
            s.config.wallets[uint(Wallets.RedeemContract)] == _msgSender(), "Unauthorized");
        _;
    }

    /* ============ External and Public Functions ============ */
    function maintain(uint256 _tokenId) public {
        address user = _msgSender();

        uint256 feeAmount = getPendingMaintenanceFee(_tokenId);
        require(feeAmount > 0, "No maintenance fee accrued,- either already paid or to soon.");

        // payment
        IERC20 dai = s.config.paymentTokens[uint(PaymentTokens.Dai)];
        require(dai.balanceOf(user) > feeAmount, "Not enough funds to pay");
        dai.transferFrom(user, s.config.wallets[uint(Wallets.Treasury)], feeAmount);

        // data update
        s.gems[_tokenId].lastMaintenanceTime = uint32(block.timestamp);
        s.gems[_tokenId].maintenanceFeePaid = feeAmount;
        emit MaintenancePaid(user, _tokenId, feeAmount);

    }

    function batchMaintain(uint256[] calldata _tokenIds) external {
        for (uint256 index = 0; index < _tokenIds.length; index++) {
            maintain(_tokenIds[index]);
        }
    }

    function fixMaintenance(uint256[] calldata _tokenIds) external onlyRedeemContract {
        for (uint256 index = 0; index < _tokenIds.length; index++) {
            AppStorage storage s = LibAppStorage.diamondStorage();
            Gem storage gem = s.gems[_tokenId];
            if (gem.lastMaintenanceTime > gem.mintTime) {
                uint256 discountedFeeDai = BoosterHelper.reduceMaintenanceFee(gem.booster, s.gemTypes[gem.gemTypeId].maintenanceFeeDai);
                gem.maintenanceFeePaid = discountedFeeDai;
            }
        }
    }

    function getPendingMaintenanceFee(uint256 _tokenId) public view returns (uint256) {
        return LibMaintainer._getPendingMaintenanceFee(_tokenId);
    }
}
