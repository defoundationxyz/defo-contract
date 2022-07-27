// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.9;

/** @title  IYieldGem EIP-2535 Diamond Facet
  * @author Decentralized Foundation Team
  * @notice Rewards Interface, operation with rewards: taxation, charity, claiming and putting to the vault
*/
interface IRewards {
    event Donated(address indexed user, uint256 amount);
    event Claimed(address indexed user, uint256 amount);
    event PutToVault(address indexed user, uint256 amount);

    function claimReward(uint256 _tokenId) external;

//    function claimReward(uint256 _tokenId, uint256 _amount) external;

    function batchClaimReward(uint256[] calldata _tokenids) external;

    function putRewardIntoVault(uint256 _tokenId) external;

    function putRewardIntoVault(uint256 _tokenId, uint256 _amount) external;

    function batchPutRewardIntoVault(uint256[] calldata _tokenIds, uint256[] calldata _amounts) external;

    /**
    *   @notice reward earned by the sender to the moment ready to be claimed or put to vault
    *   @param _tokenId unique NFT gem id
    *   @return pre-tax unclaimed reward in DEFO,- before deducting tax or charity, ready to be claimed or put to vault
    */
    function getRewardAmount(uint256 _tokenId) external view returns (uint256);

    /**
    *   @notice amount donated by the sender for all time
    *   @return amount in Dai (in wei precision)
    */
    function donatedForAllTime() external view returns (uint256);

    /**
    *   @notice amount of pre-taxed reward earned by the sender for all time
    *   @return amount in Dai (in wei precision)
    */
    function rewardForAllTime() external view returns (uint256);

    /**
    *   @notice amount of pre-taxed reward earned by all the users for all time
    *   @return amount in Dai (in wei precision)
    */
    function rewardForAllTimeAllUsers() external view returns (uint256);

    /**
    *   @notice amount donated by all the users for all time
    *   @return amount in Dai (in wei precision)
    */
    function donatedForAllTimeAllUsers() external view returns (uint256);

    /**
    *   @notice amount of pre-taxed reward that are currently in the vault for the sender, so if put and then taken from the vault, it's not the return of the function
    *   @return total amount in Dai (in wei precision)
    */
    function amountPutIntoVaultAndStillThere() external view returns (uint256);

    /**
    *   @notice amount of pre-taxed reward that are currently in the vault for all users, so if put and then taken from the vault, it's not the return of the function
    *   @return total amount in Dai (in wei precision)
    */
    function amountPutIntoVaultAndStillThereAllUsers() external view returns (uint256);

    /**
    *   @notice gets tax tier for a gem
    *   @param _tokenId unique NFT gem id
    *   @return current tax tier of the gem might be configurable, now it's a number in the range starting from 0 when 0 means nothing is payed out since there's no rewards in the first week, 4 is no tax, 1,2,3 - % in between (currently 30,30,15)
    */
    function getTaxTier(uint256 _tokenId) external view returns (uint256);

}
