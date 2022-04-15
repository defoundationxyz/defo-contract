// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;
pragma experimental ABIEncoderV2;

library LibERC721Storage {
    struct DiamondStorage {
        // Token name
        string _name;
        // Token symbol
        string _symbol;
        // Mapping from token ID to owner address
        mapping(uint256 => address) _owners;
        // Mapping owner address to token count
        mapping(address => uint256) _balances;
        // Mapping from token ID to approved address
        mapping(uint256 => address) _tokenApprovals;
        // Mapping from owner to operator approvals
        mapping(address => mapping(address => bool)) _operatorApprovals;
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
        bytes32 storagePosition = keccak256("diamond.storage.LibERC721Storage");
        // Set the position of our struct in contract storage
        assembly {
            ds.slot := storagePosition
        }
    }
}
