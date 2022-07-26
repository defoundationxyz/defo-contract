// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.9;

import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/IERC721Metadata.sol";
import {LibDiamond} from "hardhat-deploy/solc_0.8/diamond/libraries/LibDiamond.sol";
import {StorageWithModifiers} from "../libraries/LibAppStorage.sol";

/** @title  ERC721MinterBurnableEnumerablePausableFacet EIP-2535 Diamond Facet, implements ERC721 with internal minting
  * @author Decentralized Foundation Team
  * @dev This is a reusable ERC721 preset to be used in the facet, prerequisites is s.nft structure in the AppStorage
*/
contract ERC721MinterBurnableEnumerablePausableFacet is ERC721EnumerableFacet, ERC721BurnableFacet, ERC721PausableFacet {
    /* ============ Internal Functions ============ */
    function _safeMint(address to, uint256 tokenId) internal {
        _safeMint(to, tokenId, "");
    }

    function _safeMint(
        address to,
        uint256 tokenId,
        bytes memory _data
    ) internal {
        address sender = msgSender();
        _mint(to, tokenId);
        checkOnERC721Received(sender, address(0), to, tokenId, _data);
    }

    function _mint(address to, uint256 tokenId) internal {
        require(to != address(0), "ERC721: mint to the zero address");
        require(!_exists(tokenId), "ERC721: token already minted");
        _beforeTokenTransfer(address(0), to, tokenId);

        s.nft.balances[to] += 1;
        s.nft.owners[tokenId] = to;

        emit LibERC721.Transfer(address(0), to, tokenId);

        _afterTokenTransfer(address(0), to, tokenId);
    }

}
