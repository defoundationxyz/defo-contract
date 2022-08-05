// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.15;

import "../interfaces/ITransferLimiter.sol";
import "../base-facet/BaseFacet.sol";

/** @title  ERC721Facet EIP-2535 Diamond Facet
  * @author Decentralized Foundation Team
  * @notice The Contract uses diamond storage providing functionality of ERC721, ERC721Enumerable, ERC721Burnable, ERC721Pausable
*/
contract TransferLimitFacet is BaseFacet, ITransferLimiter {
    /* ============ External and Public Functions ============ */
    function yieldGemTransferLimit(
        address to,
        address from,
        uint256 tokenId
    ) public {
    }

    function DEFOTokenTransferLimit(
        address to,
        address from,
        uint256 amount
    ) public {

    }
}
