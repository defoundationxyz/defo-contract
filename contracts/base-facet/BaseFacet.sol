// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.15;

import "@openzeppelin/contracts/utils/Context.sol";
import {LibDiamond} from "hardhat-deploy/solc_0.8/diamond/libraries/LibDiamond.sol";
import "./Storage.sol";
/**
 * @title  BaseFacet
 * @author Decentralized Foundation Team
 * @notice BaseFacet is a base contract all facets to inherit, includes cross-facet utils and  common reusable functions for DEFO Diamond
 */
contract BaseFacet is Storage {

    /* ====================== Modifiers ====================== */

    modifier exists(uint256 _tokenId) {
        _requireExists(_tokenId);
        _;
    }

    modifier onlyGemHolder(uint256 _tokenId) {
        require(s.nft.owners[_tokenId] == _msgSender(), "You don't own this gem");
        _;
    }

    modifier onlyOwner() {
        LibDiamond.enforceIsContractOwner();
        _;
    }
    modifier nonZeroAddress(address _owner) {
        require(_owner != address(0), "ERC721: address zero is not a valid owner");
        _;
    }

    /* ============ Internal Functions ============ */

    function _msgSender() internal override view returns (address sender_) {
        if (Context._msgSender() == address(this)) {
            bytes memory array = msg.data;
            uint256 index = msg.data.length;
            assembly {
            // Load the 32 bytes word from memory with the address on the lower 20 bytes, and mask those.
                sender_ := and(mload(add(array, index)), 0xffffffffffffffffffffffffffffffffffffffff)
            }
        } else {
            sender_ = msg.sender;
        }
    }

    function _getChainID() internal view returns (uint256 id) {
        assembly {
            id := chainid()
        }
    }

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

}
