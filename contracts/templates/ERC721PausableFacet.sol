// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.9;

import {PausableFacet} from "./PausableFacet.sol";
import "./ERC721Facet.sol";

/** @title  ERC721PausableFacet EIP-2535 Diamond Facet
  * @author Decentralized Foundation Team
  * @notice The Contract uses diamond storage providing functionality of ERC721, ERC721Pausable
*/
contract ERC721PausableFacet is ERC721Facet, PausableFacet {
    function _beforeTokenTransfer(
        address _from,
        address _to,
        uint256 _tokenId
    ) internal virtual override {
        super._beforeTokenTransfer(_from, _to, _tokenId);
        require(!paused(), "ERC721Pausable: token transfer while paused");
    }
}
