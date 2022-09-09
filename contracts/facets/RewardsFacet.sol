// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.15;

import "../data-types/IDataTypes.sol";
import "../interfaces/IRewards.sol";
import "../base-facet/BaseFacet.sol";
import "../libraries/LibDonations.sol";
import "../libraries/LibMaintainer.sol";
import "../libraries/PercentHelper.sol";
import "../libraries/BoosterHelper.sol";
import "../libraries/PeriodicHelper.sol";
import "../libraries/TimeHelper.sol";
import "../libraries/TaxHelper.sol";
import "../libraries/FiHelper.sol";

/** @title  ERC721Facet EIP-2535 Diamond Facet
  * @author Decentralized Foundation Team
  * @notice The Contract uses diamond storage providing functionality of ERC721, ERC721Enumerable, ERC721Burnable, ERC721Pausable
*/
contract RewardsFacet is BaseFacet, IRewards {
    using FiHelper for Fi;
    using BoosterHelper for Booster;

    /* ====================== Modifiers ====================== */
    modifier onlyClaimable(uint256 _tokenId) {
        require(isClaimable(_tokenId), "Not claimable");
        _;
    }

    /* ============ External and Public Functions ============ */
    function claimReward(uint256 _tokenId) public onlyGemHolder(_tokenId) onlyClaimable(_tokenId) {
        _claimRewardAmount(_tokenId, getRewardAmount(_tokenId));
    }

    function batchClaimReward(uint256[] calldata _tokenids) external {
        for (uint256 index = 0; index < _tokenids.length; index++) {
            claimReward(_tokenids[index]);
        }
    }

    function stakeReward(uint256 _tokenId, uint256 _amount) onlyGemHolder(_tokenId) exists(_tokenId) public {
        IERC20 defo = s.config.paymentTokens[uint(PaymentTokens.Defo)];
        address[WALLETS] storage wallets = s.config.wallets;
        address user = _msgSender();
        Fi memory op;

        require(_amount > 0, "Zero rewards for a gem");
        uint256 rewardGross = getRewardAmount(_tokenId);
        require(_amount <= rewardGross, "Not enough rewards");

        op.donated = PercentHelper.rate(_amount, s.config.charityContributionRate);
        op.stakedGross = _amount;
        op.stakedNet = _amount - op.donated;

        defo.transferFrom(
            wallets[uint(Wallets.RewardPool)],
            wallets[uint(Wallets.Charity)],
            op.donated);
        emit LibDonations.Donated(user, op.donated);


        defo.transferFrom(
            wallets[uint(Wallets.RewardPool)],
            wallets[uint(Wallets.Vault)],
            op.stakedNet);
        emit Staked(user, op.stakedGross, op.stakedNet);

        op.updateStorage(_tokenId, user);
    }

    function stakeAndClaim(uint256 _tokenId, uint256 _percent) public onlyGemHolder(_tokenId) onlyClaimable(_tokenId) {
        uint256 reward = getRewardAmount(_tokenId);
        uint256 rewardToStake = PercentHelper.rate(reward, _percent);
        stakeReward(_tokenId, rewardToStake);
        claimReward(_tokenId);
    }


    function batchStakeReward(uint256[] calldata _tokenIds, uint256[] calldata _amounts) external {
        require(_tokenIds.length == _amounts.length, "DEFORewards:_tokendIds-_amounts-inconsistent");
        for (uint256 i = 0; i < _tokenIds.length; i++) {
            stakeReward(_tokenIds[i], _amounts[i]);
        }
    }

    function batchStakeAndClaim(uint256[] calldata _tokenIds, uint256 _percent) external {
        for (uint256 i = 0; i < _tokenIds.length; i++) {
            stakeAndClaim(_tokenIds[i], _percent);
        }
    }

    function getRewardAmount(uint256 _tokenId) public exists(_tokenId) view returns (uint256) {
        uint256 rewardToDate = _getCumulatedRewardAmountGross(_tokenId);
        rewardToDate += s.gems[_tokenId].fi.unStakedNet;
        rewardToDate -= s.gems[_tokenId].fi.claimedGross;
        rewardToDate -= s.gems[_tokenId].fi.stakedGross;
        return rewardToDate;
    }

    function isClaimable(uint256 _tokenId) public view returns (bool) {
        return (
        TimeHelper.hasPassedFromOrNotHappenedYet(s.gems[_tokenId].lastRewardWithdrawalTime, s.config.rewardPeriod) &&
        LibMaintainer._getPendingMaintenanceFee(_tokenId) == 0 &&
        getRewardAmount(_tokenId) != 0);
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
        return s.usersFi[_msgSender()].stakedGross - s.usersFi[_msgSender()].unStakedGrossUp;
    }

    function getStakedGrossAllUsers() external view returns (uint256) {
        return s.total.stakedGross - s.total.unStakedGrossUp;
    }

    function getTaxTier(uint256 _tokenId) public view returns (TaxTiers) {
        return TaxHelper.getTaxTier(uint32(block.timestamp) - s.gems[_tokenId].lastRewardWithdrawalTime);
    }

    /* ============ Internal Functions ============ */

    function _claimRewardAmount(uint256 _tokenId, uint256 _amount) private {
        Gem storage gem = s.gems[_tokenId];
        IERC20 defo = s.config.paymentTokens[uint(PaymentTokens.Defo)];
        address[WALLETS] storage wallets = s.config.wallets;

        require(_amount > 0, "No amount to claim");

        Fi memory op;
        op.claimedGross = _amount;

        TaxTiers taxTier = getTaxTier(_tokenId);
        op.claimTaxPaid = PercentHelper.rate(op.claimedGross, s.config.taxRates[uint256(taxTier)]);
        op.donated = PercentHelper.rate(op.claimedGross, s.config.charityContributionRate);
        op.claimedNet = op.claimedGross - op.claimTaxPaid - op.donated;

        address user = _msgSender();
        defo.transferFrom(
            wallets[uint(Wallets.RewardPool)],
            wallets[uint(Wallets.Charity)],
            op.donated);
        emit LibDonations.Donated(user, op.donated);

        defo.transferFrom(
            wallets[uint(Wallets.RewardPool)],
            user,
            op.claimedNet);
        gem.lastRewardWithdrawalTime = uint32(block.timestamp);
        emit Claimed(user, op.claimedGross, op.claimedNet);

        op.updateStorage(_tokenId, user);
    }

    function _getCumulatedRewardAmountGross(uint256 _tokenId) internal view returns (uint256) {
        Gem memory gem = s.gems[_tokenId];
        GemTypeConfig memory gemType = s.gemTypes[gem.gemTypeId];
        uint256 boostedRewardAmount = gem.booster.boostRewardsRate(gemType.rewardAmountDefo);
        uint256 totalReward = PeriodicHelper.calculateTaperedReward(
            block.timestamp - gem.mintTime, //period to calculate
            gemType.taperRewardsThresholdDefo,
            s.config.taperRate,
            boostedRewardAmount,
            s.config.rewardPeriod);
        return totalReward;
    }


}
