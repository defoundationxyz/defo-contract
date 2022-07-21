// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;
pragma experimental ABIEncoderV2;
import "./LibERC721.sol";

library LibVaultStaking {
    struct DiamondStorage {
        mapping(uint256 => uint256) StakedFrom; //amounts staked to Vault per gemID (charity deducted)
        mapping(address => uint256) StakedAmount; // address -> amount mapping (charity deducted)
        uint256 totalAmount; // total amount in the vault
    }

    // Returns the struct from a specified position in contract storage
    // ds is short for DiamondStorage
    function diamondStorage() internal pure returns (DiamondStorage storage ds) {
        // Specifies a random position in contract storage
        bytes32 storagePosition = keccak256("diamond.storage.LibVaultStaking");
        // Set the position of our struct in contract storage
        assembly {
            ds.slot := storagePosition
        }
    }
}
