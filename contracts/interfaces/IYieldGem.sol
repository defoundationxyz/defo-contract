// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.9;

//import "@openzeppelin/contracts/token/ERC721/presets/ERC721PresetMinterPauserAutoId.sol";
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

/** @title  IYieldGem, EIP-2535 Diamond Facet
  * @author Decentralized Foundation Team
  * @notice The Yield Gem Interface, minting, getting, and maintenance
*/
interface IYieldGem is IERC721 {
    function getGemDetails(uint256 _tokenId) external view returns (Gem memory);

    function getPendingMaintenance(uint256 _tokenId) external view returns (uint256);

    function mintGem(uint8 _gemType) external;

    function maintain(uint256 _tokenId) external;

    function batchMaintain(uint256[] calldata _tokenIds) external;

}
