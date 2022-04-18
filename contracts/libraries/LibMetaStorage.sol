// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;
pragma experimental ABIEncoderV2;
import "@openzeppelin/contracts/utils/Counters.sol";
import "../interfaces/IERC20.sol";

library LibMetaStorage {
    struct DiamondStorage {
        /// TODO: reorganize variable order
        uint256 MaintenanceDays;
        Counters.Counter _tokenIdCounter;
        IERC20 PaymentToken;
        IERC20 DefoToken;
        mapping(address => uint256) DistTable;
        uint256[] RewardTaxTable;
        uint256 minReward;
        uint256 RewardTime;
        uint8 MintLimitHours;
        /// @dev probably will be changed to treasury or distrubitor contract
        address Treasury;
        address RewardPool;
        address LimiterAddr;
        address Team;
        address Marketing;
        address Donation;
        address Buyback;
        address[] GenerousityList;
        /// @dev if it's 0 users can create unlimited nodes
        uint256 MaxNodes;
        /// @dev sale lock
        bool Lock;
        bool transferLock;
    }

    // Returns the struct from a specified position in contract storage
    // ds is short for DiamondStorage
    function diamondStorage()
        internal
        pure
        returns (DiamondStorage storage ds)
    {
        // Specifies a random position in contract storage
        bytes32 storagePosition = keccak256("diamond.storage.LibMetaStorage");
        // Set the position of our struct in contract storage
        assembly {
            ds.slot := storagePosition
        }
    }
}
