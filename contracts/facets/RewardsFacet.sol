// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.15;

import "../data-types/IDataTypes.sol";
import "../interfaces/IRewards.sol";
import "../interfaces/IDEXRouter02.sol";
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

    event P2DaiClaimed(address indexed user, uint256 amountDai);
    event P2PutToVault(address indexed user, uint256 amountDefo);


    /* ====================== Modifiers ====================== */
    modifier onlyClaimable(uint256 _tokenId) {
        require(isClaimable(_tokenId), "Not claimable");
        _;
    }

    modifier onlyP1Users() {
        address user = _msgSender();
        require(s.phase2DepositedToVault[user] == 0, "ROT already deposited to the vault");
        require(s.phase2DaiReceived[user] == 0, "ROT already claimed");
        _;
    }

    modifier transitionP2Started() {
        //        require(s.p2CutOverTime > 0, "Transition to Phase 2 has not started yet");
        revert("Phase 2 is over");
        _;
    }

    modifier transitionP2NotStarted() {
        require(s.p2CutOverTime == 0, "Transition to Phase 2 has already started");
        _;
    }

    /* ============ External and Public Functions ============ */
    function claimReward(uint256 _tokenId) public onlyGemHolder(_tokenId) onlyClaimable(_tokenId) transitionP2NotStarted {
        _claimRewardAmount(_tokenId, getRewardAmount(_tokenId));
    }

    function batchClaimReward(uint256[] calldata _tokenids) external transitionP2NotStarted {
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

        _sellDefoAndDonate(op.donated);
        emit LibDonations.Donated(user, op.donated);


        defo.transferFrom(
            wallets[uint(Wallets.RewardPool)],
            wallets[uint(Wallets.Vault)],
            op.stakedNet);
        emit Staked(user, op.stakedGross, op.stakedNet);

        op.updateStorage(_tokenId, user);
    }

    function stakeAndClaim(uint256 _tokenId, uint256 _percent) public onlyGemHolder(_tokenId) onlyClaimable(_tokenId) transitionP2NotStarted {
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

    function batchStakeAndClaim(uint256[] calldata _tokenIds, uint256 _percent) external transitionP2NotStarted {
        for (uint256 i = 0; i < _tokenIds.length; i++) {
            stakeAndClaim(_tokenIds[i], _percent);
        }
    }

    function p2PutIntoVault() external onlyP1Users transitionP2Started {
        IERC20 defo = s.config.paymentTokens[uint(PaymentTokens.Defo)];
        address[WALLETS] storage wallets = s.config.wallets;
        address user = _msgSender();
        uint256 amount = getP2RotValue(user);
        defo.transferFrom(wallets[uint(Wallets.RewardPool)], wallets[uint(Wallets.Vault)], amount);
        s.phase2DepositedToVault[user] = amount;
        s.totalP2DepositedToVault += amount;
        emit P2PutToVault(user, amount);
    }

    function p2ClaimDai() external onlyP1Users transitionP2Started {
        address user = _msgSender();
        uint256 daiToClaim = getP2DaiValue(user);
        s.phase2DaiReceived[user] = daiToClaim;
        IERC20 dai = s.config.paymentTokens[uint(PaymentTokens.Dai)];
        dai.transferFrom(s.config.wallets[uint(Wallets.Stabilizer)], user, daiToClaim);
        emit P2DaiClaimed(user, daiToClaim);
    }

    function getRewardAmount(uint256 _tokenId) public exists(_tokenId) view returns (uint256) {
        uint256 rewardToDate = _getCumulatedRewardAmountGross(_tokenId);
        rewardToDate += s.gems[_tokenId].fi.unStakedNet;
        rewardToDate -= s.gems[_tokenId].fi.claimedGross;
        rewardToDate -= s.gems[_tokenId].fi.stakedGross;
        return rewardToDate;
    }

    function isClaimable(uint256 _tokenId) public view returns (bool) {
        if (s.p2CutOverTime == 0)
            return (
            TimeHelper.hasPassedFromOrNotHappenedYet(s.gems[_tokenId].lastRewardWithdrawalTime, s.config.rewardPeriod) &&
            LibMaintainer._getPendingMaintenanceFee(_tokenId) == 0 &&
            getRewardAmount(_tokenId) != 0);
        else
            return false;
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


    function getP2RotValue(address user) public view returns (uint256){
        uint256[] memory gemIds = _getGemIds(user);
        uint256 rotValue = 0;
        uint256 rewardToDate = 0;
        for (uint256 i = 0; i < gemIds.length; i++) {
            uint256 gemType = s.gems[gemIds[i]].gemTypeId;
            uint256 price = s.gemTypes2[gemType].price[1];
            Booster booster = s.gems[gemIds[i]].booster;
            if (booster == Booster.Omega) {
                rotValue += price * 115 / 100;
            } else if (booster == Booster.Delta) {
                rotValue += price * 110 / 100;
            } else rotValue += price;
            rewardToDate += _getCumulatedRewardAmountGross(gemIds[i]);
        }
        return rotValue > rewardToDate ? rotValue - rewardToDate : 0;
    }

    function getMyP2RotValue() external view returns (uint256){
        address user = _msgSender();
        return getP2RotValue(user);
    }

    function getP2DaiValue(address user) public view returns (uint256){
        uint256 rotValue = getP2RotValue(user);
        return s.totalROT > 0 ? s.daiToDistribute * rotValue / s.totalROT : 0;
    }


    function getMyP2DaiValue() external view returns (uint256){
        address user = _msgSender();
        return getP2DaiValue(user);
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
        _sellDefoAndDonate(op.donated);
        emit LibDonations.Donated(user, op.donated);

        defo.transferFrom(
            wallets[uint(Wallets.RewardPool)],
            user,
            op.claimedNet);
        gem.lastRewardWithdrawalTime = uint32(block.timestamp);
        emit Claimed(user, op.claimedGross, op.claimedNet);

        op.updateStorage(_tokenId, user);
    }


    function _sellDefoAndDonate(uint256 _donationAmountDefo) private {
        IERC20 defo = s.config.paymentTokens[uint(PaymentTokens.Defo)];
        address[WALLETS] storage wallets = s.config.wallets;

        defo.transferFrom(
            wallets[uint(Wallets.RewardPool)],
            address(this),
            _donationAmountDefo);

        address[] memory path1;
        path1 = new address[](2);
        path1[0] = address(s.config.paymentTokens[uint(PaymentTokens.Defo)]);
        path1[1] = address(s.config.paymentTokens[uint(PaymentTokens.Dai)]);
        IDEXRouter02(s.routerWallet).swapExactTokensForTokens(
            _donationAmountDefo,
            1,
            path1,
            wallets[uint(Wallets.Charity)],
            block.timestamp);
    }


    function _getCumulatedRewardAmountGross(uint256 _tokenId) internal view returns (uint256) {
        Gem memory gem = s.gems[_tokenId];
        GemTypeConfig memory gemType = s.gemTypes2[gem.gemTypeId];
        uint256 boostedRewardAmount = gem.booster.boostRewardsRate(gemType.rewardAmountDefo);
        uint256 toDate = s.p2CutOverTime > 0 ? s.p2CutOverTime : block.timestamp;
        if (toDate < gem.mintTime) {
            return 0;
        }
        uint256 totalReward = PeriodicHelper.calculateTaperedReward(
            toDate - gem.mintTime, //period to calculate
            gemType.taperRewardsThresholdDefo,
            s.config.taperRate,
            boostedRewardAmount,
            s.config.rewardPeriod);
        return totalReward;
    }

    function calculateTaperedReward(
        uint timePeriod, //blockit i.timestamp - mintTime
        uint256 taperThreshold, //120 for diamond
        uint256 taperPercent, //80% usually, NOTE this is 80% but not 20%
        uint ratePerPeriod, //5 for diamond, pass already boosted rate if boost is applicable
        uint payOrDeductPeriod //in seconds, initially it's 1 week
    ) public view returns (uint256) {
        uint256 totalReward = PeriodicHelper.calculateTaperedReward(
            timePeriod, //period to calculate
            taperThreshold,
            taperPercent,
            ratePerPeriod,
            payOrDeductPeriod);
        return totalReward;
    }

}
