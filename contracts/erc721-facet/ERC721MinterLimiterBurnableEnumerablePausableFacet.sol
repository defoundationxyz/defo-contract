// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.9;

import "./ERC721EnumerableFacet.sol";
import "./ERC721BurnableFacet.sol";
import "./ERC721Facet.sol";
import "./PausableFacet.sol";

/** @title  ERC721MinterBurnableEnumerablePausableFacet EIP-2535 Diamond Facet, implements ERC721 with internal minting
  * @author Decentralized Foundation Team
  * @dev This is a reusable ERC721 preset to be used in the facet, prerequisites is s.nft structure in the AppStorage
*/
contract ERC721MinterLimiterBurnableEnumerablePausableFacet is 
ERC721EnumerableFacet, ERC721BurnableFacet, PausableFacet {

    /* ============ Internal Functions ============ */

    function _safeMint(address to, uint256 tokenId) internal {
        _safeMint(to, tokenId, "");
    }

    function _safeMint(
        address to,
        uint256 tokenId,
        bytes memory _data
    ) internal {
        address sender = _msgSender();
        _mint(to, tokenId);
        _checkOnERC721Received(sender, address(0), to, tokenId, _data);
    }

    function _mint(address to, uint256 tokenId) internal {
        require(to != address(0), "ERC721: mint to the zero address");
        require(!_exists(tokenId), "ERC721: token already minted");
        _beforeTokenTransfer(address(0), to, tokenId);

        s.nft.balances[to]++;
        s.nft.owners[tokenId] = to;

        emit Transfer(address(0), to, tokenId);

        _afterTokenTransfer(address(0), to, tokenId);
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId
    ) internal virtual override(ERC721EnumerableFacet, ERC721Facet) whenNotPaused() {
        super._beforeTokenTransfer(from, to, tokenId);
        if (address(s.nft.limiter) != address(0)) {
            s.nft.limiter.transferLimit(from, to, tokenId);
        }
    }

    function _afterTokenTransfer(
        address from,
        address to,
        uint256 tokenId
    ) internal virtual override(ERC721EnumerableFacet, ERC721Facet) {
        super._afterTokenTransfer(from, to, tokenId);
    }


}
