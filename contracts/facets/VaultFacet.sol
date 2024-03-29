// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.15;

import "../interfaces/IVault.sol";
import "../base-facet/BaseFacet.sol";
import "../libraries/LibDonations.sol";
import "../libraries/PercentHelper.sol";
import "../libraries/BoosterHelper.sol";
import "../libraries/PeriodicHelper.sol";
import "../libraries/TimeHelper.sol";
import "../libraries/TaxHelper.sol";
import "../libraries/FiHelper.sol";

/** @title  VaultFacet EIP-2535 Diamond Facet
  * @author Decentralized Foundation Team
  * @notice Vault functionality - unStake, lottery, and getters
*/
contract VaultFacet is BaseFacet, IVault {
    using FiHelper for Fi;

    modifier onlyP1Users() {
        address user = _msgSender();
        require(s.phase2DepositedToVault[user] == 0, "ROT already deposited to the vault");
        require(s.phase2DaiReceived[user] == 0, "ROT already claimed");
        _;
    }

    /* ============ External and Public Functions ============ */
    function unStakeReward(uint256 _tokenId, uint256 _amount) external onlyGemHolder(_tokenId) onlyP1Users {
        address user = _msgSender();
        Gem storage gem = s.gems[_tokenId];
        uint256 vaultAmount = gem.fi.stakedNet - gem.fi.unStakedGross;
        require(vaultAmount >= _amount, "Not enough amount in the vault for the gem");
        IERC20 defo = s.config.paymentTokens[uint(PaymentTokens.Defo)];
        address[WALLETS] storage wallets = s.config.wallets;
        Fi memory op;

        op.unStakedGross = _amount;
        op.unStakedGrossUp = PercentHelper.grossUp(_amount, s.config.charityContributionRate);
        // sending withdrawal tax to the reward wallet
        uint256 discountedFee = BoosterHelper.reduceVaultWithdrawalFee(gem.booster, s.config.vaultWithdrawalTaxRate);
        op.vaultTaxPaid = PercentHelper.rate(_amount, discountedFee);
        defo.transferFrom(
            wallets[uint(Wallets.Vault)],
            wallets[uint(Wallets.RewardPool)],
            op.vaultTaxPaid);

        op.unStakedNet = _amount - op.vaultTaxPaid;

        defo.transferFrom(
            wallets[uint(Wallets.Vault)],
            wallets[uint(Wallets.RewardPool)],
            op.unStakedNet);

        emit UnStaked(user, op.unStakedGross, op.unStakedNet);
        op.updateStorage(_tokenId, user);
    }

    function giveaway(uint256 _defoAmount) public {
        address minter = _msgSender();
        IERC20 defo = s.config.paymentTokens[uint(PaymentTokens.Defo)];
        address[WALLETS] storage wallets = s.config.wallets;
        require(_defoAmount > 0, "Zero rewards for a gem");

        Fi memory op;
        op.stakedGross = _defoAmount;
        op.stakedNet = _defoAmount;

        defo.transferFrom(
            minter,
            wallets[uint(Wallets.Vault)],
            _defoAmount);
        op.updateStorage(minter);
        emit GivenAway(minter, _defoAmount);
    }

    function configureLottery(uint256 _numberOfWinners, uint32 _lotteryStart, uint32 _periodicity) external {

    }

    function getStaked(uint256 _tokenId) external view returns (uint256) {
        return s.gems[_tokenId].fi.stakedNet - s.gems[_tokenId].fi.unStakedGross;
    }

    function getStakedAllGems() external view returns (uint256[] memory tokenIds_, uint256[] memory amounts_) {
        address user = _msgSender();
        tokenIds_ = _getGemIds(user);
        amounts_ = new uint256[](tokenIds_.length);
        for (uint256 i = 0; i < tokenIds_.length; i++) {
            uint256 tokenId = tokenIds_[i];
            amounts_[i] = s.gems[tokenId].fi.stakedNet - s.gems[tokenId].fi.unStakedGross;
        }
        return (tokenIds_, amounts_);
    }

    function getTotalStaked() external view returns (uint256) {
        address user = _msgSender();
        return s.usersFi[user].stakedNet - s.usersFi[user].unStakedGross + s.phase2DepositedToVault[user];
    }

    function getTotalStakedAllUsers() external view returns (uint256) {
        return s.total.stakedNet - s.total.unStakedGross + s.totalP2DepositedToVault;
    }

    function lotteryWinners(uint32 _timestamp) external view returns (address[] memory) {
    }
}
