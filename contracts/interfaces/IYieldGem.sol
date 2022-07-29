// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.15;

import "@openzeppelin/contracts/token/ERC721/presets/ERC721PresetMinterPauserAutoId.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "../data-types/IDataTypes.sol";

/** @title  IYieldGem, EIP-2535 Diamond Facet
  * @author Decentralized Foundation Team
  * @notice The Yield Gem Interface on top of the ERC721 standard,- minting, state and donation getters
*/
interface IYieldGem is IERC721 {
    /**
    * @notice Mints a gem, requires appropriate balance of DEFO and DAI and also approvals granted to the diamond contract to spent them
    * @param _gemTypeId gem type according to the enumeration, initially it's 0 for sapphire, 1 for ruby, 2 for diamond
    */
    function mint(uint8 _gemTypeId) external;

    function getGemInfo(uint256 _tokenId) external view returns (Gem memory);

    function getGemIds() external view returns (uint256[] memory);

    function getGemsInfo() external view returns (uint256[] memory, Gem[] memory);

    function isMintAvailable(uint8 _gemTypeId) external view returns (bool);

    function getMintWindow(uint8 _gemTypeId) external view returns (GemTypeMintWindow memory);

    /**
    *   @notice amount donated by the sender for all time
    *   @return amount in Dai (in wei precision)
    */
    function getTotalDonated() external view returns (uint256);

    /**
    *   @notice amount donated by all the users for all time
    *   @return amount in Dai (in wei precision)
    */
    function getTotalDonatedAllUsers() external view returns (uint256);

}
