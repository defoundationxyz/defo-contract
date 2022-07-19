// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;
pragma experimental ABIEncoderV2;

import "./LibERC721.sol";
import "./LibMeta.sol";
import "./helpers/TaxHelper.sol";
import "./helpers/RewardHelper.sol";
import "./helpers/BoosterHelper.sol";
import "./helpers/PercentHelper.sol";
import "hardhat/console.sol";
import "./helpers/TimeHelper.sol";
import "./helpers/TaperHelper.sol";

//
library LibGem {
    using TaxHelper for uint256;
    using RewardHelper for uint256;
    using TaperHelper for uint;
    using PercentHelper for uint256;
    using TimeHelper for uint256;
    using TaxHelper for TaxHelper.TaxTier;
    using BoosterHelper for Booster;

    enum Booster {
        None,
        Delta,
        Omega
    }

    struct Gem {
        uint256 MintTime; // timestamp of the mint time
        uint256 LastReward; // timestamp of last reward claim OR stake. Same as MintTime if not yet claimed.
        uint256 LastMaintained; // timestamp of last maintenance (could be a date in the future in case of upfront payment)
        uint8 GemType; // node type right now 0 -> Ruby , 1 -> Sapphire and 2 -> Diamond
        uint8 TaperCount; // Count of how much taper applied
        /// @dev i'm not sure if enums are packed as uint8 in here
        Booster booster; // Node Booster 0 -> None , 1 -> Delta , 2 -> Omega
        uint256 claimedReward; // previously claimed rewards (before tax and charity)
        uint256 stakedReward; // rewards previously added to vault (before tax and charity).
        uint256 unclaimedRewardBalance; // balance on the moment of LastReward before claim, have to maintain since can be put to vault partly
        uint256 taperedRewardRate; // current tapered reward rate (if 5 is the initial one, this takes valus of 4, 3.2, 2.56, etc.
    }

    /// @dev A struct for keeping info about node types
    struct GemTypeMetadata {
        uint256 LastMint; // last mint timestamp
        uint256 MaintenanceFee; //amount in wei:  Maintenance fee for the node type, amount per month
        uint256 RewardRate; //amount in wei:  Reward in DEFO for the node type, amount per week
        uint8 DailyLimit; // global mint limit for a node type
        uint8 MintCount; // mint count resets every MintLimitPeriod
        uint256 DefoPrice; //amount in wei:  Required Defo tokens while minting
        uint256 StablePrice; //amount in wei:  Required StableCoin tokens while minting
        uint256 TaperRewardsThreshold; //amount in wei: Taper threshold, decreasing rate every given amount of rewards in DEFO
        uint256 maintenancePeriod; //maintenance period, one month, also used to apply to the first free period
    }

    struct DiamondStorage {
        mapping(uint256 => Gem) GemOf; // tokenid -> node struct mapping
        mapping(uint8 => GemTypeMetadata) GetGemTypeMetadata; // node type id -> metadata mapping
        address MinterAddr;
        uint256 taperRate; // 20%
    }

    function _taperedReward(uint256 _tokenId) internal view returns (uint256) {
        DiamondStorage storage ds = LibGem.diamondStorage();
        LibMeta.DiamondStorage storage metads = LibMeta.diamondStorage();
        LibGem.Gem storage gem = ds.GemOf[_tokenId];
        LibGem.GemTypeMetadata memory gemType = ds.GetGemTypeMetadata[gem.GemType];
        console.log("---_taperedReward, tokenId: ", _tokenId);
        console.log("gemType.RewardRate", gemType.RewardRate);
        uint256 _boostedRate = gem.booster.boostRewardsRate(gemType.RewardRate);
        console.log("_boostedRate ", _boostedRate);
        uint currentTime = block.timestamp - gem.MintTime;
        uint256 _taperThreshold = gemType.TaperRewardsThreshold;

        //calculating tapered reward from the early beginning, the mint time
        uint taperedReward = currentTime.calcTaperedReward(_taperThreshold,
            ds.taperRate.oneHundredLessPercent(), //80% usually, NOTE this is 80% but not 20%
            _boostedRate, //5 for diamond
            metads.RewardTime //in seconds, initially it's 1 week
        );
        console.log("taperedReward", taperedReward);

        //returning tapered less paid and staked
        return taperedReward-gem.claimedReward-gem.stakedReward;
    }

    function _checkRawReward(uint256 _tokenid) internal view returns (uint256 defoRewards) {
        console.log("_checkRawReward, tokenid: ", _tokenid);
        DiamondStorage storage ds = LibGem.diamondStorage();
        LibGem.Gem memory gem = ds.GemOf[_tokenid];
        LibGem.GemTypeMetadata memory gemType = ds.GetGemTypeMetadata[gem.GemType];
        LibMeta.DiamondStorage storage metads = LibMeta.diamondStorage();
        console.log("gemType.RewardRate", gemType.RewardRate);
        uint256 _boostedRate = gem.booster.boostRewardsRate(gemType.RewardRate);
        console.log("_boostedRate ", _boostedRate);
        return _boostedRate.calculatePeriodic(gem.LastReward, metads.RewardTime) + gem.unclaimedRewardBalance;
    }

    function _getTaxTier(uint256 tokenId) internal view returns (TaxHelper.TaxTier) {
        DiamondStorage storage ds = LibGem.diamondStorage();
        LibGem.Gem memory gem = ds.GemOf[tokenId];
        return (block.timestamp - gem.LastReward).getTaxTier();
    }

    // reward rate changes depending on the time
    function _rewardTax(uint256 tokenid) internal view returns (uint256) {
        TaxHelper.TaxTier tier = _getTaxTier(tokenid);
        return tier.getTaxRate();
    }

    // View Functions
    function _isActive(uint256 _tokenid) internal view returns (bool) {
        DiamondStorage storage ds = LibGem.diamondStorage();
        LibMeta.DiamondStorage storage metads = LibMeta.diamondStorage();
        LibGem.Gem memory gem = ds.GemOf[_tokenid];
        return (gem.LastMaintained.notPassedFromOrNotHappenedYet(metads.MaintenancePeriod));
    }

    // @notice checks if the gem is claimable
    function _isClaimable(uint256 _tokenId) internal view returns (bool) {
        LibGem.DiamondStorage storage ds = LibGem.diamondStorage();
        LibMeta.DiamondStorage storage metads = LibMeta.diamondStorage();
        LibGem.Gem memory gem = ds.GemOf[_tokenId];
        return (gem.LastReward.hasPassedFromOrNotHappenedYet(metads.RewardTime) && LibGem._isActive(_tokenId));
    }


    // Returns the struct from a specified position in contract storage
    // ds is short for DiamondStorage
    function diamondStorage() internal pure returns (DiamondStorage storage ds) {
        // Specifies a random position in contract storage
        bytes32 storagePosition = keccak256("diamond.storage.LibGem");
        // Set the position of our struct in contract storage
        assembly {
            ds.slot := storagePosition
        }
    }
}
