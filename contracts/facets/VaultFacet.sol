// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.15;

import "../data-types/IDataTypes.sol";
import "../interfaces/IVault.sol";
import "../base-facet/BaseFacet.sol";
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

    /* ============ External and Public Functions ============ */
    function unStakeReward(uint256 _tokenId, uint256 _amount) external onlyGemHolder(_tokenId) {
        address user = _msgSender();
        require(s.usersFi[user].stakedGross >= _amount, "not enough amount in the vault");
        Gem storage gem = s.gems[_tokenId];
        IERC20 defo = s.config.paymentTokens[uint(PaymentTokens.Defo)];
        address[WALLETS] storage wallets = s.config.wallets;
        Fi memory op;

        op.donated = PercentHelper.rate(_amount, s.config.charityContributionRate);
        op.unStakedNet = _amount - op.donated;
        defo.transferFrom(
            wallets[uint(Wallets.Vault)],
            wallets[uint(Wallets.Charity)],
            op.donated);
        emit Donated(user, op.donated);

        // sending withdrawal tax to the reward wallet
        uint256 discountedFee = BoosterHelper.reduceVaultWithdrawalFee(gem.booster, s.config.vaultWithdrawalTaxRate);
        op.vaultTaxPaid = PercentHelper.rate(_amount, discountedFee);
        defo.transferFrom(
            wallets[uint(Wallets.Vault)],
            wallets[uint(Wallets.RewardPool)],
            op.vaultTaxPaid);

        op.unStakedNet -= op.vaultTaxPaid;

        defo.transferFrom(
            wallets[uint(Wallets.Vault)],
            wallets[uint(Wallets.RewardPool)],
            op.unStakedNet);

        emit UnStaked(user, op.unStakedGross, op.unStakedNet);
        op.updateStorage(_tokenId, user);
    }

    function configureLottery(uint256 _numberOfWinners, uint32 _lotteryStart, uint32 _periodicity) external {

    }

    function getStaked(uint256 _tokenId) external view returns (uint256) {
        return s.gems[_tokenId].fi.stakedNet - s.gems[_tokenId].fi.unStakedGross;
    }

    function getTotalStaked() external view returns (uint256) {
        address user = _msgSender();
        return s.usersFi[user].stakedNet - s.usersFi[user].unStakedGross;
    }

    function getTotalStakedAllUsers() external view returns (uint256) {
        return s.total.stakedNet - s.total.unStakedGross;
    }

    function lotteryWinners(uint32 _timestamp) external view returns (address[] memory) {

    }

}
