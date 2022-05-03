// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

/// @title Defo Vault Staking Facet
/// @author jvoljvolizka
/// @notice contains functions for vault staking from unclaimed rewards and unlocking

import "../libraries/LibERC721.sol";
import "../libraries/LibGem.sol";
import "../libraries/LibUser.sol";
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
        require(LibGem._isActive(_tokenId), "Gem is deactivated");
        _;
    }

    function batchAddTovault(
        uint256[] calldata _tokenIds,
        uint256[] calldata _amounts
    ) external {
        LibGem.DiamondStorage storage dsgem = LibGem.diamondStorage();
        LibMeta.DiamondStorage storage metads = LibMeta.diamondStorage();
        LibUser.DiamondStorage storage userds = LibUser.diamondStorage();
        LibUser.UserData storage user = userds.GetUserData[LibMeta.msgSender()];
        LibVaultStaking.DiamondStorage storage ds = LibVaultStaking
            .diamondStorage();
        for (uint256 index = 0; index < _tokenIds.length; index++) {
            require(
                LibERC721._ownerOf(_tokenIds[index]) == LibERC721.msgSender(),
                "You don't own this gem"
            );
            require(LibGem._isActive(_tokenIds[index]), "Gem is deactivated");
            uint256 _pendingRewards = LibGem._taperCalculate(_tokenIds[index]);
            require(
                _amounts[index] >= _pendingRewards,
                "Not enough pending rewards"
            );
            LibGem.Gem storage gem = dsgem.GemOf[_tokenIds[index]];

            uint256 charityAmount = (metads.CharityRate * _amounts[index]) /
                1000;
            _amounts[index] = _amounts[index] - charityAmount;

            metads.DefoToken.transferFrom(
                metads.RewardPool,
                metads.Donation,
                charityAmount
            );
            user.charityContribution = user.charityContribution + charityAmount;
            gem.claimedReward = gem.claimedReward + _amounts[index];
            ds.StakedAmount[LibMeta.msgSender()] = _amounts[index];
            metads.DefoToken.transferFrom(
                LibMeta.msgSender(),
                metads.Vault,
                _amounts[index]
            );
            ds.StakedFrom[_tokenIds[index]] =
                ds.StakedFrom[_tokenIds[index]] +
                _amounts[index];
        }
    }

    function addToVault(uint256 _tokenId, uint256 amount)
        public
        onlyGemOwner(_tokenId)
        onlyActive(_tokenId)
    {
        LibGem.DiamondStorage storage dsgem = LibGem.diamondStorage();
        LibMeta.DiamondStorage storage metads = LibMeta.diamondStorage();
        LibUser.DiamondStorage storage userds = LibUser.diamondStorage();
        LibUser.UserData storage user = userds.GetUserData[LibMeta.msgSender()];
        LibVaultStaking.DiamondStorage storage ds = LibVaultStaking
            .diamondStorage();
        uint256 _pendingRewards = LibGem._taperCalculate(_tokenId);
        require(amount >= _pendingRewards, "Not enough pending rewards");
        LibGem.Gem storage gem = dsgem.GemOf[_tokenId];

        uint256 charityAmount = (metads.CharityRate * amount) / 1000;
        amount = amount - charityAmount;

        metads.DefoToken.transferFrom(
            metads.RewardPool,
            metads.Donation,
            charityAmount
        );
        user.charityContribution = user.charityContribution + charityAmount;
        gem.claimedReward = gem.claimedReward + amount;
        ds.StakedAmount[LibMeta.msgSender()] = amount;
        metads.DefoToken.transferFrom(
            LibMeta.msgSender(),
            metads.Vault,
            amount
        );
        ds.StakedFrom[_tokenId] = ds.StakedFrom[_tokenId] + amount;
    }

    function showStakedAmount() public view returns (uint256) {
        LibVaultStaking.DiamondStorage storage ds = LibVaultStaking
            .diamondStorage();
        return ds.StakedAmount[LibMeta.msgSender()];
    }

    function unstakeTokens(uint256 _tokenId, uint256 amount)
        public
        onlyGemOwner(_tokenId)
    {
        LibUser.DiamondStorage storage userds = LibUser.diamondStorage();
        LibUser.UserData storage userData = userds.GetUserData[
            LibMeta.msgSender()
        ];
        LibGem.DiamondStorage storage dsgem = LibGem.diamondStorage();
        LibVaultStaking.DiamondStorage storage ds = LibVaultStaking
            .diamondStorage();
        LibMeta.DiamondStorage storage metads = LibMeta.diamondStorage();
        address user = LibMeta.msgSender();
        require(ds.StakedAmount[user] >= amount, "Not enough staked tokens");
        ds.StakedAmount[user] = ds.StakedAmount[user] - amount;
        LibGem.Gem storage gem = dsgem.GemOf[_tokenId];
        uint256 charityAmount = (metads.CharityRate * amount) / 1000;
        amount = amount + charityAmount;

        metads.DefoToken.transferFrom(
            metads.Donation,
            metads.RewardPool,
            charityAmount
        );
        userData.charityContribution =
            userData.charityContribution -
            charityAmount;
        uint256 taxed = (amount * 10) / 100;
        metads.DefoToken.transferFrom(
            metads.Vault,
            LibMeta.msgSender(),
            amount - taxed
        );
        ds.StakedFrom[_tokenId] = ds.StakedFrom[_tokenId] - amount;
        gem.claimedReward = gem.claimedReward - (amount - taxed);
        metads.DefoToken.transferFrom(metads.Vault, metads.RewardPool, taxed);
    }
}
