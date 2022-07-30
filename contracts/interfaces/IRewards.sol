// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.15;

import "../data-types/IDataTypes.sol";

/** @title  IYieldGem EIP-2535 Diamond Facet
  * @author Decentralized Foundation Team
  * @notice Rewards Interface, operation with rewards: taxation, charity, claiming and putting to the vault
*/
interface IRewards {
    event Donated(address indexed user, uint256 amount);
    event Claimed(address indexed user, uint256 amountGross, uint256 amountNet);
    event Staked(address indexed user, uint256 amountGross, uint256 amountNet);

    function claimReward(uint256 _tokenId) external;

    //maybe I'll add that feat later: selects an amount to claim
//    function claimReward(uint256 _tokenId, uint256 _amount) external;

    function batchClaimReward(uint256[] calldata _tokenids) external;

    //maybe I'll add that feat later: puts all the reward into vault
//    function stakeReward(uint256 _tokenId) external;

    ///todo decide whether move this to the vault facet or not - (to keep all staking/unstaking in one place), or to leave it here (this is a facet working with rewards  which can be either claimed or staked)
    function stakeReward(uint256 _tokenId, uint256 _amount) external;

    function batchStakeReward(uint256[] calldata _tokenIds, uint256[] calldata _amounts) external;

    /**
    *   @notice reward earned by the sender to the moment ready to be claimed or put to vault
    *   @param _tokenId unique NFT gem id
    *   @return pre-tax unclaimed reward in DEFO,- before deducting tax or charity, ready to be claimed or put to vault
    */
    function getRewardAmount(uint256 _tokenId) external view returns (uint256);

    /**
*   @notice checks if rewards can be claimed or not
    *   @param _tokenId unique NFT gem id
    *   @return true or false, checks for the pending maintenance and time passed since last claim
    */
    function isClaimable(uint256 _tokenId) external view returns (bool);

    /**
    *   @notice amount of pre-taxed total reward earned by the sender for all time
    *   @return amount in Dai (in wei precision)
    */
    function getCumulatedReward() external view returns (uint256);

    /**
    *   @notice amount of pre-taxed total reward earned by all the users for all time
    *   @return amount in Dai (in wei precision)
    */
    function getCumulatedRewardAllUsers() external view returns (uint256);


    /**
    *   @notice amount of pre-taxed reward that are currently in the vault for the sender, so if put and then taken from the vault, it's not the return of the function
    *   @return total amount in Dai (in wei precision)
    */
    function getStakedGross() external view returns (uint256);

    /**
    *   @notice amount of pre-taxed reward that are currently in the vault for all users, it's not equal to the after-tax amount in the vault
    *   @return total amount in Dai (in wei precision)
    */
    function getStakedGrossAllUsers() external view returns (uint256);

    /**
    *   @notice gets tax tier for a gem
    *   @param _tokenId unique NFT gem id
    *   @return current tax tier of the gem might be configurable, now it's a number in the range starting from 0 when 0 means nothing is payed out since there's no rewards in the first week, 4 is no tax, 1,2,3 - % in between (currently 30,30,15)
    */
    function getTaxTier(uint256 _tokenId) external view returns (TaxTiers);


}
