// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;
pragma experimental ABIEncoderV2;
import "../interfaces/IERC721.sol";

library LibERC721EnumerableStorage {
    struct DiamondStorage {
        IERC721 erc721;
        // Mapping from owner to list of owned token IDs
        mapping(address => mapping(uint256 => uint256)) _ownedTokens;
        // Mapping from token ID to index of the owner tokens list
        mapping(uint256 => uint256) _ownedTokensIndex;
        // Array with all token ids, used for enumeration
        uint256[] _allTokens;
        // Mapping from token id to position in the allTokens array
        mapping(uint256 => uint256) _allTokensIndex;
    }

    // Returns the struct from a specified position in contract storage
    // ds is short for DiamondStorage
    function diamondStorage()
        internal
        pure
        returns (DiamondStorage storage ds)
    {
        // Specifies a random position in contract storage
        // This can be done with a keccak256 hash of a unique string as is
        // done here or other schemes can be used such as this:
        // bytes32 storagePosition = keccak256(abi.encodePacked(ERC1155.interfaceId, ERC1155.name, address(this)));
        bytes32 storagePosition = keccak256(
            "diamond.storage.LibERC721EnumerableStorage"
        );
        // Set the position of our struct in contract storage
        assembly {
            ds.slot := storagePosition
        }
    }
}
