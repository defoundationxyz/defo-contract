//SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

contract MockGemHybridFacet {

    enum Booster {
        None,
        Delta,
        Omega
    }

    struct Gem {
        uint32 MintTime; // timestamp of the mint time
        uint32 LastReward; // timestamp of last reward claim
        uint32 LastMaintained; // timestamp of last maintenance (could be a date in the future in case of upfront payment)
        uint8 GemType; // node type right now 0 -> Ruby , 1 -> Sapphire and 2 -> Diamond
        uint8 TaperCount; // Count of how much taper applied
        //Booster booster; // Node Booster 0 -> None , 1 -> Delta , 2 -> Omega
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

    function GemOf(uint256 _tokenId) external pure returns (Gem memory) {
        Gem memory gem = Gem({
            MintTime: 0,
            LastReward: 0,
            LastMaintained: 0,
            GemType: 0,
            TaperCount: 0,
            //Booster: Booster.Delta,
            claimedReward: 0
        });
        return gem;
    }

    function GetGemTypeMetadata(uint8 _type)
        external
        pure
        returns (GemTypeMetadata memory)
    {
        GemTypeMetadata memory gemType = GemTypeMetadata({
            LastMint: 0,
            MaintenanceFee: 0,
            RewardRate: 50,
            DailyLimit: 0,
            MintCount: 0,
            DefoPrice: 0,
            StablePrice: 0
        });
        return gemType;
    }
}