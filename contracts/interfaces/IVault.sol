// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.15;

/** @title  IVault EIP-2535 Diamond Facet
  * @author Decentralized Foundation Team
  * @notice Vault Interface - unStake, lottery, and getters
*/
interface IVault {
    // @dev here if we unStake, say, 100 DEFO from the vault, the  amountGross is unStaked, amountNet comes back to earned rewards
    event UnStaked(address indexed user, uint256 amountGross, uint256 amountNet);
    event GivenAway(address indexed minter, uint256 amountDefo);
    event LotteryConfigured(uint256 numberOfWinners, uint32 lotteryStart, uint32 periodicity);
    event LotteryWinnersDetermined(uint256[] winners);

    /**
    * @notice remove DEFO amount from the vault back to the unclaimed rewards
    * @param _tokenId yield gem id
    * @param _amount amount to remove from the vault in DEFO (wei precision)
    */
    function unStakeReward(uint256 _tokenId, uint256 _amount) external;

    /**
    * @notice vault lottery configuration
    * @param _numberOfWinners number of winners of the vault lottery
    * @param _lotteryStart lottery start moment to remember, blocktime format, zero for blocktime
    * @param _periodicity periodicity in seconds, initially weekly
    */
    function configureLottery(uint256 _numberOfWinners, uint32 _lotteryStart, uint32 _periodicity) external;

    /**
    * @notice put defo to the vault from the user's wallet
    * @param _defoAmount amount of DeFo to put to vault
    */
    function giveaway(uint256 _defoAmount) external;

    /**
    * @notice get DEFO amount currently in the vault for a specific yield gem
    * @param _tokenId yield gem id
    * @return amount in DEFO (wei precision)
    */
    function getStaked(uint256 _tokenId) external view returns (uint256);

    /**
    * @notice get DEFO amount currently in the vault for all user's yield gems
    * @return tokenIds_ array of staked tokenIds
    * @return amounts_ array of amounts (gross, currently in the vault)
    */
    function getStakedAllGems() external view returns (uint256[] memory tokenIds_, uint256[] memory amounts_);

    /**
    * @notice get amount currently in the vault for sender
    * @return amount in DEFO (wei precision)
    */
    function getTotalStaked() external view returns (uint256);

    /**
    * @notice get amount currently in the vault for all protocol users
    * @return amount in DEFO (wei precision)
    */
    function getTotalStakedAllUsers() external view returns (uint256);

    /**
    * @notice gets lottery winners in the lottery interval containing _timestamp
    * @param _timestamp moment of the query, zero if now
    * @return addresses of the lottery winners
    * @dev the ones related to the requested period are put to the storage to return the same number in the future
    */
    function lotteryWinners(uint32 _timestamp) external view returns (address[] memory);

}
