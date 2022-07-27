// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.9;

import "../data-types/IDataTypes.sol";
import "../interfaces/IRewards.sol";
import "../base-facet/BaseFacet.sol";
import "../libraries/PercentHelper.sol";
import "../libraries/BoosterHelper.sol";
import "../libraries/PeriodicHelper.sol";

/** @title  ERC721Facet EIP-2535 Diamond Facet
  * @author Decentralized Foundation Team
  * @notice The Contract uses diamond storage providing functionality of ERC721, ERC721Enumerable, ERC721Burnable, ERC721Pausable
*/
contract RewardsFacet is BaseFacet, IRewards {
    function claimReward(uint256 _tokenId) external {
        Gem memory gem = s.gems[_tokenId];
        GemTypeConfig memory gemType = s.gemTypes[gem.gemTypeId];
        uint256 boostedRate = BoosterHelper.boostRewardsRate(gem.booster, gemType.RewardRate);
        uint256 reward = PeriodicHelper.calculatePeriodic(boostedRate, gem.LastReward, metads.RewardTime) + gem.unclaimedRewardBalance;
        return reward;

    }

    function batchClaimReward(uint256[] calldata _tokenids) external {

    }

    function putRewardIntoVault(uint256 _tokenId) external {

    }

    function putRewardIntoVault(uint256 _tokenId, uint256 _amount) external {

    }

    function batchPutRewardIntoVault(uint256[] calldata _tokenIds, uint256[] calldata _amounts) external {

    }

    function reward(uint256 _tokenId) external view returns (uint256) {

    }

    function donatedForAllTime() external view returns (uint256) {

    }

    function rewardForAllTime() external view returns (uint256) {

    }

    function rewardForAllTimeAllUsers() external view returns (uint256) {

    }

    function donatedForAllTimeAllUsers() external view returns (uint256) {

    }

    function amountPutIntoVaultAndStillThere() external view returns (uint256) {

    }

    function amountPutIntoVaultAndStillThereAllUsers() external view returns (uint256) {

    }

    function getTaxTier(uint256 _tokenId) external view returns (uint256) {

    }

}
