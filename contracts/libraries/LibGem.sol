// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;
pragma experimental ABIEncoderV2;
import "./LibERC721.sol";
import "./LibMeta.sol";

library LibGem {
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
        /// @dev i'm not sure if enums are packed as uint8 in here
        Booster Booster; // Node Booster 0 -> None , 1 -> Delta , 2 -> Omega
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
        address MinterAddr;
        uint256 taperRate; // if it's %20 this value should be 80
    }

    /// calculates the reward taper with roi after 1x everytime roi achived rewards taper by %20
    /// could be more optimized
    /// always calculates rewards from 0
    function _taperCalculate(uint256 _tokenId) internal view returns (uint256) {
        LibGem.DiamondStorage storage ds = LibGem.diamondStorage();
        LibGem.Gem storage gem = ds.GemOf[_tokenId];
        LibGem.GemTypeMetadata memory gemType = ds.GetGemTypeMetadata[
            gem.GemType
        ];
        uint256 rewardCount = _checkRawReward(_tokenId) + gem.claimedReward; // get reward without taper
        uint256 actualReward = 0;

        uint256 typePrice = gemType.DefoPrice;
        if (rewardCount > typePrice) {
            while (rewardCount > typePrice) {
                rewardCount = rewardCount - typePrice;
                actualReward = actualReward + typePrice;
                rewardCount = (((rewardCount) * ds.taperRate) / 100);
            }
            /// TODO : check for overflows
            return actualReward + rewardCount - gem.claimedReward;
        }
        return _checkRawReward(_tokenId); // if less than roi don't taper
    }

    function _checkRawReward(uint256 _tokenid)
        internal
        view
        returns (uint256 defoRewards)
    {
        LibGem.DiamondStorage storage ds = LibGem.diamondStorage();
        LibGem.Gem memory gem = ds.GemOf[_tokenid];
        LibGem.GemTypeMetadata memory gemType = ds.GetGemTypeMetadata[
            gem.GemType
        ];

        uint256 _rate = gemType.RewardRate;
        if (gem.Booster == LibGem.Booster.Omega) {
            _rate = _rate * 2;
        } else if (gem.Booster == LibGem.Booster.Delta) {
            _rate = _rate + (((_rate * 20)) / 100);
        }

        uint256 _lastTime = gem.LastReward;
        uint256 _passedDays = (block.timestamp - _lastTime) / 60 / 60 / 24;

        uint256 _rewardDefo = _passedDays *
            ((_rate * gemType.DefoPrice) / 1000);
        uint256 taxRate = _rewardTax(_tokenid);
        if (taxRate != 0) {
            _rewardDefo = (_rewardDefo - ((taxRate * _rewardDefo) / 1000));
        }
        return (_rewardDefo);
    }

    // reward rate changes depending on the time
    function _rewardTax(uint256 _tokenid) internal view returns (uint256) {
        LibGem.DiamondStorage storage ds = LibGem.diamondStorage();
        LibGem.Gem memory gem = ds.GemOf[_tokenid];
        LibMeta.DiamondStorage storage metads = LibMeta.diamondStorage();
        uint32 diff = uint32(block.timestamp) - gem.LastReward;
        if (diff < 1 weeks) {
            return metads.RewardTaxTable[0];
        } else if (diff > 2 weeks && diff < 3 weeks) {
            return metads.RewardTaxTable[1];
        } else if (diff > 3 weeks && diff < 4 weeks) {
            return metads.RewardTaxTable[2];
        } else {
            return metads.RewardTaxTable[3];
        }
    }

    // View Functions
    function _isActive(uint256 _tokenid) internal view returns (bool) {
        LibGem.DiamondStorage storage ds = LibGem.diamondStorage();
        LibMeta.DiamondStorage storage metads = LibMeta.diamondStorage();
        LibGem.Gem memory gem = ds.GemOf[_tokenid];
        uint256 _lastTime = gem.LastMaintained;
        uint256 _passedDays = (block.timestamp - _lastTime) / 60 / 60 / 24;

        return !(_passedDays > metads.MaintenanceDays);
    }

    // Returns the struct from a specified position in contract storage
    // ds is short for DiamondStorage
    function diamondStorage()
        internal
        pure
        returns (DiamondStorage storage ds)
    {
        // Specifies a random position in contract storage
        bytes32 storagePosition = keccak256("diamond.storage.LibGem");
        // Set the position of our struct in contract storage
        assembly {
            ds.slot := storagePosition
        }
    }
}
