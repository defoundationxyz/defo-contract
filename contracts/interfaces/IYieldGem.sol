// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.9;

import "@openzeppelin/contracts/token/ERC721/presets/ERC721PresetMinterPauserAutoId.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

///todo add events
    enum Booster {
        None,
        Delta,
        Omega
    }

/**
 * @notice current state of a gem, a gem is an instance with consistent yield and fee rates specified by the pair (gemType, booster)
 * @param gemType node type, initially it's  0 -> Ruby , 1 -> Sapphire, 2 -> Diamond, and boosters
 * @param booster node Booster 0 -> None , 1 -> Delta , 2 -> Omega
 * @param mintTime timestamp of the mint time
 * @param lastRewardWithdrawalTime timestamp of last reward claim OR stake. Same as mintTime if not yet claimed.
 * @param lastMaintenanceTime timestamp of the last maintenance (could be a date in the future in case of the upfront payment)
 * @param cumulatedClaimedRewardAmount rewards amount previously claimed for all time (before tax and charity)
 * @param cumulatedAddedToVaultAmount rewards amount previously added to vault (less returned back)
 * @param cumulatedAddedToVault rewards previously added to vault  for all time (before tax and charity).
*/
    struct Gem {
        uint8 gemType;
        Booster booster;
        uint32 mintTime;
        uint32 boostTime;
        uint32 lastRewardWithdrawalTime;
        uint32 lastMaintenanceTime;
        uint256 cumulatedClaimedRewardAmount;
        uint256 cumulatedAddedToVaultAmount;
    }

/**
 * @notice A struct containing current mutable status for gemType
     * @param mintCount counter incrementing by one on every mint, during mintCountResetPeriod; after mintCountResetPeriod with no mints, reset to 0
     * @param endOfMintLimitWindow a moment to reset the mintCount counter to zero, set the new endOfMintLimitWindow and start over
     */
    struct GemTypeMintWindow {
        uint256 mintCount;
        uint32 endOfMintLimitWindow;
    }


/** @title  IYieldGem, EIP-2535 Diamond Facet
  * @author Decentralized Foundation Team
  * @notice The Yield Gem Interface, minting, getting, and maintenance
*/
interface IYieldGem is IERC721 {
    /**
    * @notice Mints a gem, requires appropriate balance of DEFO and DAI and also approvals granted to the diamond contract to spent them
    */
    function mint(uint8 _gemType) external;

    /**
    * @notice Pays for maintenance till block.timestamp
    */
    function maintain(uint256 _tokenId) external;

    function batchMaintain(uint256[] calldata _tokenIds) external;

    function gem(uint256 _tokenId) external view returns (Gem memory);

    function gemIds() external view returns (uint256[] memory);

    function gems() external view returns (uint256[] memory, Gem[] memory);

    function pendingMaintenance(uint256 _tokenId) external view returns (uint256);

    function isMintAvailable(uint8 _gemType) external view returns (bool);

    function mintWindow(uint8 _gemType) external view returns (GemTypeMintWindow memory);

}
