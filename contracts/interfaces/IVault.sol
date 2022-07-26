// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.9;

/** @title  IYieldGem, EIP-2535 Diamond Facet
  * @author Decentralized Foundation Team
  * @notice Rewards Interface, this is the core functionality of the DEFO Protocol, taxation, charity, claiming and staking
*/
interface IVault {
    event Donated(address indexed user, uint256 amount);
    event RemovedFromVault(address indexed user, uint256 amount);

    /**
    * @notice remove DEFO amount from the vault back to the unclaimed rewards
    * @param _tokenId yield gem id
    * @param _amount amount to remove from the vault in DEFO (wei precision)
    */
    function removeFromVault(uint256 _tokenId, uint256 _amount) external;

    /**
    * @notice get amount currently in the vault for a specific yield gem
    * @param _tokenId yield gem id
    * @return amount in DEFO (wei precision)
    */
    function gemVaultAmount(uint256 _tokenId) external view returns (uint256);

    /**
    * @notice get amount currently in the vault for sender
    * @return amount in DEFO (wei precision)
    */
    function vaultAmount() external view returns (uint256);

    /**
    * @notice get amount currently in the vault for all protocol participants
    * @return amount in DEFO (wei precision)
    */
    function vaultAmountAllParticipants() external view returns (uint256);

}