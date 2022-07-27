// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.9;

import "../data-types/IDataTypes.sol";
import "../interfaces/IRewards.sol";
import "../base-facet/BaseFacet.sol";
import "../libraries/PercentHelper.sol";
import "../libraries/BoosterHelper.sol";
import "../libraries/PeriodicHelper.sol";
import "../libraries/TimeHelper.sol";
import "../libraries/TaxHelper.sol";

/** @title  ERC721Facet EIP-2535 Diamond Facet
  * @author Decentralized Foundation Team
  * @notice The Contract uses diamond storage providing functionality of ERC721, ERC721Enumerable, ERC721Burnable, ERC721Pausable
*/
contract RewardsFacet is BaseFacet, IRewards {

    /* ============ External and Public Functions ============ */
    function claimReward(uint256 _tokenId) external {
        Gem memory gem = s.gems[_tokenId];
        GemTypeConfig memory gemType = s.gemTypes[gem.gemTypeId];
        require(
            TimeHelper.hasPassedFromOrNotHappenedYet(gem.lastRewardWithdrawalTime, s.config.rewardPeriod) &&
            _getPendingMaintenanceFee(_tokenId) == 0, "Not claimable");
        uint256 baseReward = getRewardAmount(_tokenId);

        uint256 taxTier = getTaxTier(_tokenId);
        uint256 reward = baseReward - PercentHelper.lessRate(baseReward, s.taxRates[taxTier]);

        uint256 charityAmount = PercentHelper.rate(baseReward, s.config.charityContributionRate);
        reward -= charityAmount;

        address user = _msgSender();
        config.paymentTokens[uint(PaymentTokens.Defo)].transferFrom(
            config.wallets[uint(Wallets.RewardPool)],
            config.wallets[uint(Wallets.Charity)],
            charityAmount);
        s.totalDonated += charityAmount;
        s.usersData[user].donated += charityAmount;
        emit DonationEvent(user, charityAmount);


        config.paymentTokens[uint(PaymentTokens.Defo)].transferFrom(
            config.wallets[uint(Wallets.Treasury)],
            user,
            reward);
        s.totalDonated += charityAmount;
        s.usersData[user].donated += charityAmount;
        emit DonationEvent(user, charityAmount);

        s.gems[_tokenId].claimedReward += _rewardToClaim;
        s.gems[_tokenId].lastRewardWithdrawalTime = block.timestamp;
        s.gems[_tokenId].cumulatedClaimedRewardDefo += baseReward;
        s.usersData[user].claimedGross += baseReward;
        s.usersData[user].claimedNet += reward;
        emit WithdrawEvent(user, reward);
    }

    function batchClaimReward(uint256[] calldata _tokenids) external {

    }

    function putRewardIntoVault(uint256 _tokenId) external {

    }

    function putRewardIntoVault(uint256 _tokenId, uint256 _amount) external {

    }

    function batchPutRewardIntoVault(uint256[] calldata _tokenIds, uint256[] calldata _amounts) external {

    }

    function getRewardAmount(uint256 _tokenId) public view returns (uint256) {
        uint256 totalReward = getCumulatedRewardAmount(_tokenId);
        totalReward -= gem.cumulatedClaimedRewardDefo;
        totalReward -= gem.cumulatedAddedToVaultDefo;
        return totalReward;
    }

    function donatedForAllTime() external view returns (uint256) {

    }

    function rewardForAllTime() external view returns (uint256) {
        address user = _msgSender();
        uint256 gemIds = _getGemIds(user);
        uint256 reward = 0;
        for (uint256 i = 0; i < gemIds.length; i++) {
            reward += getCumulatedRewardAmount(gemIds[i]);
        }
        return reward;
    }

    function rewardForAllTimeAllUsers() external view returns (uint256) {

    }

    function donatedForAllTimeAllUsers() external view returns (uint256) {

    }

    function amountPutIntoVaultAndStillThere() external view returns (uint256) {

    }

    function amountPutIntoVaultAndStillThereAllUsers() external view returns (uint256) {

    }

    function getTaxTier(uint256 _tokenId) public view returns (uint256) {
        return TaxHelper.getTaxTier(block.timestamp - s.gems[_tokenId].lastRewardWithdrawalTime);
    }

    /* ============ Internal Functions ============ */

    function getCumulatedRewardAmount(uint256 _tokenId) internal view returns (uint256) {
        Gem memory gem = s.gems[_tokenId];
        GemTypeConfig memory gemType = s.gemTypes[gem.gemTypeId];
        uint256 boostedAmountDefo = BoosterHelper.boostRewardsRate(gem.booster, gemType.rewardAmountDefo);
        uint256 totalReward;
        if (gem.boostTime == 0) {
            totalReward = PeriodicHelper.calculateTaperedReward(
                block.timestamp - gem.mintTime,
                gemType.taperRewardsThresholdDefo,
                s.config.taperRate,
                gemType.rewardAmountDefo,
                s.config.rewardPeriod);
        }
        else {
            require(gem.mintTime < gem.boostTime, "Mint time is later than boost time");
            ///todo should calculate unboostedReward, then add boosted, both considered in a single taper
            uint256 unboostedReward = PeriodicHelper.calculatePeriodic(gemType.rewardAmountDefo, gem.mintTime, gem.boostTime, s.config.rewardPeriod);
            uint256 boostedReward = PeriodicHelper.calculatePeriodic(boostedAmountDefo, gem.boostTime, s.config.rewardPeriod);
            //            uint256 unboostedReward = PeriodicHelper.calculateTaperedReward(
            //                gem.boostTime - gem.mintTime,
            //                gemType.taperRewardsThresholdDefo,
            //                s.config.taperRate,
            //                gemType.rewardAmountDefo,
            //                s.config.rewardPeriod);

            totalReward = unboostedReward + boostedReward;
        }
        return totalReward;
    }


}
