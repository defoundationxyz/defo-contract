// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.9;

import "@openzeppelin/contracts/utils/Context.sol";
import {LibDiamond} from "hardhat-deploy/solc_0.8/diamond/libraries/LibDiamond.sol";
import "./Pause.sol";

/**
 * @title  FacetReady
 * @author Decentralized Foundation Team
 * @notice FacetReady is a base contract all facets to inherit from, - it includes Storage (see AppStorage pattern), modifiers, and reusable internal view functions
 */
contract BaseFacet is Pause {
    modifier onlyOwner() {
        LibDiamond.enforceIsContractOwner();
        _;
    }
    modifier nonZeroAddress(address _owner) {
        require(_owner != address(0), "ERC721: address zero is not a valid owner");
        _;
    }

    modifier exists(uint256 _tokenId) {
        _requireExists(_tokenId);
        _;
    }

    function _requireExists(uint256 _tokenId) internal view {
        require(_exists(_tokenId), "ERC721: tokenId is not valid");
    }

    function _exists(uint256 _tokenId) internal view returns (bool) {
        return (s.nft.owners[_tokenId] != address(0));
    }

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

    function _getChainID() internal view returns (uint256 id) {
        assembly {
            id := chainid()
        }
    }

}
