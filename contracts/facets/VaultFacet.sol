// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.15;

import "../data-types/IDataTypes.sol";
import "../interfaces/IRewards.sol";
import "../base-facet/BaseFacet.sol";
import "../libraries/PercentHelper.sol";
import "../libraries/BoosterHelper.sol";
import "../libraries/PeriodicHelper.sol";
import "../libraries/TimeHelper.sol";
import "../libraries/TaxHelper.sol";

/** @title  VaultFacet EIP-2535 Diamond Facet
  * @author Decentralized Foundation Team
  * @notice Vault functionality - unstake, lottery, and getters
*/
contract VaultFacet is BaseFacet, IRewards {

    /* ============ External and Public Functions ============ */
    function unstakeReward(uint256 _tokenId, uint256 _amount) external onlyGemHolder {
        address user = _msgSender();
        require(s.usersData[usersData].stakedGross >= _amount, "not enough amount in the vault");

        IERC20 defo = s.config.paymentTokens[uint(PaymentTokens.Defo)];
        address payable[WALLETS] storage wallets = s.config.wallets;

        uint256 charityAmount = PercentHelper.rate(_amount, s.config.charityContributionRate);
        amount = _amount - charityAmount;
        defo.transferFrom(
            wallets[uint(Wallets.Vault)],
            wallets[uint(Wallets.Charity)],
            charityAmount);
        s.totalDonated += charityAmount;
        s.usersData[user].donated += charityAmount;
        emit Donated(user, charityAmount);



        defo.transferFrom(
            wallets[uint(Wallets.Vault)],
            wallets[uint(Wallets.RewardPool)],
            reward);
        s.usersData[user].claimedGross += rewardGross;
        s.usersData[user].claimedNet += reward;
        s.totalClaimedGross += rewardGross;
        s.totalClaimedNet += reward;
        emit Claimed(user, rewardGross, reward);
    }

    function batchClaimReward(uint256[] calldata _tokenids) external {
        for (uint256 index = 0; index < _tokenids.length; index++) {
            claimReward(_tokenids[index]);
        }
    }

    function stakeReward(uint256 _tokenId, uint256 _amount) onlyGemHolder(_tokenId) public {
        Gem storage gem = s.gems[_tokenId];
        IERC20 defo = s.config.paymentTokens[uint(PaymentTokens.Defo)];
        address payable[WALLETS] storage wallets = s.config.wallets;
        address user = _msgSender();

        uint256 rewardGross = getRewardAmount(_tokenId);
        require(_amount <= rewardGross, "Not enough pending rewards");

        uint256 charityAmount = PercentHelper.rate(_amount, s.config.charityContributionRate);
        uint amountLessCharity = _amount - charityAmount;

        defo.transferFrom(
            wallets[uint(Wallets.RewardPool)],
            wallets[uint(Wallets.Charity)],
            charityAmount);
        s.totalDonated += charityAmount;
        s.usersData[user].donated += charityAmount;
        emit Donated(user, charityAmount);


        defo.transferFrom(
            wallets[uint(Wallets.RewardPool)],
            wallets[uint(Wallets.Vault)],
            amountLessCharity);
        gem.stakedGross += _amount;
        gem.stakedNet += amountLessCharity;
        s.usersData[user].stakedGross += _amount;
        s.usersData[user].stakedNet += amountLessCharity;
        s.totalStakedGross += _amount;
        s.totalStakedNet += amountLessCharity;
        emit Staked(user, _amount, amountLessCharity);
    }


    function batchStakeReward(uint256[] calldata _tokenIds, uint256[] calldata _amounts) external {
        require(_tokenIds.length == _amounts.length, "_tokendIds and _amounts should have the same length");
        for (uint256 i = 0; i < _tokenIds.length; i++) {
            stakeReward(_tokenIds[i], _amounts[i]);
        }
    }

    function getRewardAmount(uint256 _tokenId) public view returns (uint256) {
        uint256 rewardToDate = _getCumulatedRewardAmountGross(_tokenId);
        rewardToDate -= s.gems[_tokenId].claimedGross;
        rewardToDate -= s.gems[_tokenId].stakedGross;
        return rewardToDate;
    }

    function getTotalDonated() external view returns (uint256) {
        address user = _msgSender();
        return s.usersData[user].donated;
    }

    function getTotalDonatedAllUsers() external view returns (uint256) {
        return s.totalDonated;
    }

    function getCumulatedReward() external view returns (uint256) {
        address user = _msgSender();
        uint256[] memory gemIds = _getGemIds(user);
        uint256 reward = 0;
        for (uint256 i = 0; i < gemIds.length; i++) {
            reward += _getCumulatedRewardAmountGross(gemIds[i]);
        }
        return reward;
    }

    function getCumulatedRewardAllUsers() external view returns (uint256 allForAllTotalReward_) {
        for (uint256 tokenId = 0; tokenId < s.nft.allTokens.length; tokenId++) {
            allForAllTotalReward_ += _getCumulatedRewardAmountGross(tokenId);
        }
    }



    function getStakedGross() external view returns (uint256) {
        return s.usersData[_msgSender()].stakedGross;
    }

    function getStakedGrossAllUsers() external view returns (uint256) {
        return s.totalStakedGross;
    }

    function getTaxTier(uint256 _tokenId) public view returns (TaxTiers) {
        return TaxHelper.getTaxTier(uint32(block.timestamp) - s.gems[_tokenId].lastRewardWithdrawalTime);
    }

    /* ============ Internal Functions ============ */

    function _getCumulatedRewardAmountGross(uint256 _tokenId) internal view returns (uint256) {
        Gem memory gem = s.gems[_tokenId];
        GemTypeConfig memory gemType = s.gemTypes[gem.gemTypeId];
        uint256 totalReward;
        if (gem.boostTime == 0) {
            (totalReward,) = PeriodicHelper.calculateTaperedRewardAndRate(
                block.timestamp - gem.mintTime, //period to calculate
                gemType.taperRewardsThresholdDefo,
                s.config.taperRate,
                gemType.rewardAmountDefo,
                s.config.rewardPeriod);
        }
        else {
            require(gem.mintTime < gem.boostTime, "Mint time is later than boost time");
            totalReward = PeriodicHelper.calculateTaperedRewardWithIntermediateBoost(
                gem.boostTime - gem.mintTime,
                gemType.taperRewardsThresholdDefo,
                s.config.taperRate,
                gemType.rewardAmountDefo,
                gem.booster,
                gem.boostTime - gem.mintTime, //unboostedPeriod
                s.config.rewardPeriod);
        }
        return totalReward;
    }


}
