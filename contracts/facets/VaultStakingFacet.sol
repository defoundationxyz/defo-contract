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

    function batchAddToVault(
        uint256[] memory _tokenIds,
        uint256[] memory _amounts
    ) external {
        for (uint256 index = 0; index < _tokenIds.length; index++) {
            require(
                LibERC721._ownerOf(_tokenIds[index]) == LibERC721.msgSender(),
                "You don't own this gem"
            );
            require(LibGem._isActive(_tokenIds[index]), "Gem is deactivated");
            addToVault(_tokenIds[index], _amounts[index]);
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
        metads.TotalCharity = metads.TotalCharity + charityAmount;
        gem.claimedReward = gem.claimedReward + amount;
        ds.StakedAmount[LibMeta.msgSender()] =
            ds.StakedAmount[LibMeta.msgSender()] +
            amount;
        metads.DefoToken.transferFrom(
            LibMeta.msgSender(),
            metads.Vault,
            amount
        );
        ds.StakedFrom[_tokenId] = ds.StakedFrom[_tokenId] + amount;
        ds.totalAmount = ds.totalAmount + amount;
    }

    function showStakedAmount() public view returns (uint256) {
        LibVaultStaking.DiamondStorage storage ds = LibVaultStaking
            .diamondStorage();
        return ds.StakedAmount[LibMeta.msgSender()];
    }

    function showTotalAmount() public view returns (uint256) {
        LibVaultStaking.DiamondStorage storage ds = LibVaultStaking
            .diamondStorage();
        return ds.totalAmount;
    }

    function gemVaultAmount(uint256 _tokenId) public view returns (uint256) {
        LibVaultStaking.DiamondStorage storage ds = LibVaultStaking
            .diamondStorage();
        return ds.StakedFrom[_tokenId];
    }

    function getAllVaultAmounts(address _user)
        public
        view
        returns (uint256[] memory)
    {
        LibVaultStaking.DiamondStorage storage ds = LibVaultStaking
            .diamondStorage();
        uint256 numberOfGems = LibERC721._balanceOf(_user);
        uint256[] memory vaultAmounts = new uint256[](numberOfGems);
        for (uint256 i = 0; i < numberOfGems; i++) {
            uint256 gemId = LibERC721Enumerable._tokenOfOwnerByIndex(_user, i);
            require(LibERC721._exists(gemId), "This gem doesn't exists");
            vaultAmounts[i] = ds.StakedFrom[gemId];
        }
        return vaultAmounts;
    }

    function removeAllFromVault() public {
        LibVaultStaking.DiamondStorage storage ds = LibVaultStaking
            .diamondStorage();
        uint256 numberOfGems = LibERC721._balanceOf(LibMeta.msgSender());
        uint256[] memory vaultAmounts = new uint256[](numberOfGems);
        for (uint256 i = 0; i < numberOfGems; i++) {
            uint256 gemId = LibERC721Enumerable._tokenOfOwnerByIndex(
                LibMeta.msgSender(),
                i
            );
            require(LibERC721._exists(gemId), "This gem doesn't exists");
            vaultAmounts[i] = ds.StakedFrom[gemId];
            removeFromVault(gemId, ds.StakedFrom[gemId]);
        }
    }

    function removeFromVault(uint256 _tokenId, uint256 amount)
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
        /*amount = amount + charityAmount;*/
        //TODO: this could create problems
        metads.DefoToken.transferFrom(
            metads.Donation,
            metads.RewardPool,
            charityAmount
        );
        userData.charityContribution =
            userData.charityContribution -
            charityAmount;
        metads.TotalCharity = metads.TotalCharity - charityAmount;
        uint256 taxed = ((amount) * 10) / 100;
        metads.DefoToken.transferFrom(
            metads.Vault,
            LibMeta.msgSender(),
            amount - taxed
        );

        ds.StakedFrom[_tokenId] = ds.StakedFrom[_tokenId] - amount;
        ds.totalAmount = ds.totalAmount - amount;
        gem.claimedReward = gem.claimedReward - (amount - taxed);

        metads.DefoToken.transferFrom(metads.Vault, metads.RewardPool, taxed);
    }
}
