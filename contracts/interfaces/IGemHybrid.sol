// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

/**
    Interace for diamond facets - it's called hybrid because it blends multiple contract
    functions into one, and this can be done because we are using EIP-2535 (Diamond standard)
  */

interface IGemHybrid {
    enum Booster {
        None,
        Delta,
        Omega
    }

    struct Gem {
        uint256 MintTime; // timestamp of the mint time
        uint256 LastReward; // timestamp of last reward claim
        uint256 LastMaintained; // timestamp of last maintenance (could be a date in the future in case of upfront payment)
        uint8 GemType; // node type right now 0 -> Ruby , 1 -> Sapphire and 2 -> Diamond
        uint8 TaperCount; // Count of how much taper applied
        Booster booster; // Node Booster 0 -> None , 1 -> Delta , 2 -> Omega
        uint256 claimedReward; // previously claimed rewards, including those deposited to vault
    }

    /// @dev A struct for keeping info about node types
    struct GemTypeMetadata {
        uint256 LastMint; // last mint timestamp
        uint256 MaintenanceFee; // Maintenance fee for the node type written and calculated as a percentage of DefoPrice so it can be maximum 1000
        uint256 RewardRate; // Reward rate  for the node type written and calculated as a percentage of DefoPrice so it can be maximum 1000
        uint8 DailyLimit; // global mint limit for a node type
        uint8 MintCount; // mint count resets every MintLimitPeriod
        uint256 DefoPrice; // Required Defo tokens while minting
        uint256 StablePrice; // Required StableCoin tokens while minting
    }

    function getGemIdsOf(address _user) external returns (uint256[] memory);

    function getGemIdsOfWithType(address _user, uint8 _type) external returns (uint256[] memory);

    function GemOf(uint256 _tokenId) external view returns (Gem memory);

    function GetGemTypeMetadata(uint8 _type) external returns (GemTypeMetadata memory);
}
