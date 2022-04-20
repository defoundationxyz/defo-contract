// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

/// @title Defo Vault Staking Facet
/// @author jvoljvolizka
/// @notice contains functions for vault staking from unclaimed rewards and unlocking

import "../libraries/LibERC721.sol";
import "../libraries/LibGem.sol";
import "../libraries/LibMeta.sol";
import "../libraries/LibVaultStaking.sol";

contract VaultStakingFacet {
    modifier onlyGemOwner(uint256 _tokenId) {
        require(
            LibERC721._ownerOf(_tokenId) == LibERC721.msgSender(),
            "You don't own this gem"
        );
        _;
    }

    modifier onlyActive(uint256 _tokenId) {
        require(LibGem.isActive(_tokenId), "Gem is deactivated");
        _;
    }

    function addToVault(uint256 _tokenId, uint256 amount)
        public
        onlyGemOwner(_tokenId)
        onlyActive(_tokenId)
    {
        LibGem.DiamondStorage storage dsgem = LibGem.diamondStorage();
        LibMeta.DiamondStorage storage metads = LibMeta.diamondStorage();
        LibVaultStaking.DiamondStorage storage ds = LibVaultStaking
            .diamondStorage();
        uint256 _pendingRewards = LibGem._taperCalculate(_tokenId);
        require(amount >= _pendingRewards, "Not enough pending rewards");
        LibGem.Gem storage gem = dsgem.GemOf[_tokenId];
        gem.claimedReward = gem.claimedReward + amount;
        ds.StakedAmount[LibMeta.msgSender()] = amount;
        metads.DefoToken.transferFrom(
            LibMeta.msgSender(),
            metads.Vault,
            amount
        );
    }

    function showStakedAmount() public view returns (uint256) {
        LibVaultStaking.DiamondStorage storage ds = LibVaultStaking
            .diamondStorage();
        return ds.StakedAmount[LibMeta.msgSender()];
    }

    function unstakeTokens(uint256 amount) public {
        LibVaultStaking.DiamondStorage storage ds = LibVaultStaking
            .diamondStorage();
        LibMeta.DiamondStorage storage metads = LibMeta.diamondStorage();
        address user = LibMeta.msgSender();
        require(ds.StakedAmount[user] >= amount, "Not enough staked tokens");
        ds.StakedAmount[user] = ds.StakedAmount[user] - amount;
        uint256 taxed = (amount * 10) / 100;
        metads.DefoToken.transferFrom(
            metads.Vault,
            LibMeta.msgSender(),
            amount - taxed
        );
        metads.DefoToken.transferFrom(metads.Vault, metads.RewardPool, taxed);
    }
}
