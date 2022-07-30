// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.15;

import "../data-types/IDataTypes.sol";
import "../interfaces/IMaintenence.sol";
import "../base-facet/BaseFacet.sol";

/** @title  ERC721Facet EIP-2535 Diamond Facet
  * @author Decentralized Foundation Team
  * @notice The Contract uses diamond storage providing functionality of ERC721, ERC721Enumerable, ERC721Burnable, ERC721Pausable
*/
contract MaintenanceFacet is BaseFacet, IMaintenance {

    function maintain(uint256 _tokenId) public {
        address user = _msgSender();

        uint256 feeAmount = getPendingMaintenanceFee(_tokenId);

        // payment
        IERC20 dai = s.config.paymentTokens[uint(PaymentTokens.Dai)];
        require(dai.balanceOf(user) > feeAmount, "Not enough funds to pay");
        dai.transferFrom(user, s.config.wallets[uint(Wallets.Treasury)], feeAmount);

        // data update
        s.gems[_tokenId].lastMaintenanceTime = uint32(block.timestamp);
        emit MaintenancePaid(user, _tokenId, feeAmount);

    }

    function batchMaintain(uint256[] calldata _tokenIds) external {
        for (uint256 index = 0; index < _tokenIds.length; index++) {
            maintain(_tokenIds[index]);
        }
    }

    function getPendingMaintenanceFee(uint256 _tokenId) public view returns (uint256) {
        return _getPendingMaintenanceFee(_tokenId);
    }
}
