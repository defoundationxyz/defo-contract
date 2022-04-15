// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;
pragma experimental ABIEncoderV2;

library LibGemStorage {
    enum GemModif {
        None,
        Fast,
        Generous
    }

    enum Booster {
        None,
        Delta,
        Omega
    }
    struct Gem {
        uint32 MintTime; // timestamp of the mint time
        uint32 LastReward; // timestamp of last reward claim
        uint32 LastMaintained; // timestamp of last maintenance (could be a date in the future in case of upfront payment)
        uint8 NodeType; // node type right now 0 -> Ruby , 1 -> Sapphire and 2 -> Diamond
        uint8 TaperCount; // Count of how much taper applied
        /// @dev i'm not sure if enums are packed as uint8 in here
        GemModif Modifier; // Node Modifier 0 -> None , 1 -> Fast , 2 -> Generous
        Booster Booster; // Node Boosyer 0 -> None , 1 -> Delta , 2 -> Omega
        uint256 claimedReward; // previously claimed rewards
    }

    /// @dev A struct for keeping info about node types
    struct GemTypeMetadata {
        uint32 LastMint; // last mint timestamp
        uint16 MaintenanceFee; // Maintenance fee for the node type written and calculated as a percentage of DefoPrice so it can be maximum 1000
        uint16 RewardRate; // Reward rate  for the node type written and calculated as a percentage of DefoPrice so it can be maximum 1000
        uint8 DailyLimit; // global mint limit for a node type
        uint8 MintCount; // mint count resets every MintLimitHours hours
        uint256 DefoPrice; // Required Defo tokens while minting
        uint256 StablePrice; // Required StableCoin tokens while minting
    }

    struct DiamondStorage {
        mapping(uint256 => Gem) GemOf; // tokenid -> node struct mapping
        mapping(uint8 => GemTypeMetadata) GetGemTypeMetadata; // node type id -> metadata mapping
    }

    // Returns the struct from a specified position in contract storage
    // ds is short for DiamondStorage
    function diamondStorage()
        internal
        pure
        returns (DiamondStorage storage ds)
    {
        // Specifies a random position in contract storage
        bytes32 storagePosition = keccak256("diamond.storage.LibGemStorage");
        // Set the position of our struct in contract storage
        assembly {
            ds.slot := storagePosition
        }
    }
}
