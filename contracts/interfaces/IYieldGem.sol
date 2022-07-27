// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.9;

import "@openzeppelin/contracts/token/ERC721/presets/ERC721PresetMinterPauserAutoId.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "./IDataStructures.sol";

/** @title  IYieldGem, EIP-2535 Diamond Facet
  * @author Decentralized Foundation Team
  * @notice The Yield Gem Interface, minting, getting, and maintenance
*/
interface IYieldGem is IERC721 {
    /**
    * @notice Mints a gem, requires appropriate balance of DEFO and DAI and also approvals granted to the diamond contract to spent them
    */
    function mint(uint8 _gemTypeId) external;

    /**
    * @notice Pays for maintenance till block.timestamp, also allowing to pay for someone else
    */
    function maintain(uint256 _tokenId) external;
    function maintain(uint256 _tokenId, address _user) external;

    function batchMaintain(uint256[] calldata _tokenIds) external;

    function getGemData(uint256 _tokenId) external view returns (Gem memory);

    function getGemIds() external view returns (uint256[] memory);

    function getGemsData() external view returns (uint256[] memory, Gem[] memory);

    function getPendingMaintenanceFee(uint256 _tokenId) external view returns (uint256);

    function isMintAvailable(uint8 _gemTypeId) external view returns (bool);

    function getMintWindow(uint8 _gemTypeId) external view returns (GemTypeMintWindow memory);

}
