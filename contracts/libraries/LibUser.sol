// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;
pragma experimental ABIEncoderV2;

library LibUser {
    /// @dev a struct for keeping info and state about users
    struct UserData {
        mapping(uint256 => uint256) OmegaClaims; // Remaining Omega booster claims of the user
        mapping(uint256 => uint256) DeltaClaims; // Remaining Delta
        uint256 charityContribution;
        bool blacklisted; // Whether the user is blacklisted or not
    }

    struct DiamondStorage {
        address[] users;
        mapping(address => UserData) GetUserData; // user address -> UserData struct mapping
    }

    // Returns the struct from a specified position in contract storage
    // ds is short for DiamondStorage
    function diamondStorage() internal pure returns (DiamondStorage storage ds) {
        // Specifies a random position in contract storage
        bytes32 storagePosition = keccak256("diamond.storage.LibUser");
        // Set the position of our struct in contract storage
        assembly {
            ds.slot := storagePosition
        }
    }
}
