// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.9;

import "@openzeppelin/contracts/utils/Counters.sol";
import "./ERC721EnumerableFacet.sol";
import "./ERC721BurnableFacet.sol";
import "./ERC721Facet.sol";

/** @title  ERC721MinterBurnableEnumerablePausableFacet EIP-2535 Diamond Facet, implements ERC721 with internal minting
  * @author Decentralized Foundation Team
  * @dev This is a reusable ERC721 preset to be used in the facet, prerequisites is s.nft structure in the AppStorage
*/
contract ERC721AutoIdMinterLimiterBurnableEnumerablePausableFacet is ERC721EnumerableFacet, ERC721BurnableFacet {
    using Counters for Counters.Counter;

    /* ============ Internal Functions ============ */

    function _safeMint(address _to) internal returns (uint256 tokenId_) {
        address sender = _msgSender();
        tokenId_ = _mint(_to);
        _checkOnERC721Received(sender, address(0), _to, tokenId_, "");
    }

    function _mint(address _to) internal returns (uint256 tokenId_)  {
        tokenId_ = s.nft.tokenIdTracker.current();
        _mint(_to, tokenId_);
        s.nft.tokenIdTracker.increment();
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
