// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.15;

import "@openzeppelin/contracts/token/ERC721/presets/ERC721PresetMinterPauserAutoId.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "../data-types/IDataTypes.sol";

/** @title  IYieldGem, EIP-2535 Diamond Facet
  * @author Decentralized Foundation Team
  * @notice The Yield Gem Interface on top of the ERC721 standard,- minting, state and donation getters
*/
interface IYieldGem {
    /**
    * @notice Mints a gem, requires appropriate balance of DEFO and DAI and also approvals granted to the diamond contract to spent them
    * @param _gemTypeId gem type according to the enumeration, initially it's 0 for sapphire, 1 for ruby, 2 for diamond
    */
    function mint(uint8 _gemTypeId) external;

    /**
    * @notice For redeem usage
    */

    function mintTo(uint8 _gemType, address _to, Booster _booster) external;

    function mintToFew(uint8 _gemType, address _to, Booster _booster, uint8 _number) external;

    function mintToBulk(uint8[] calldata _gemType, address[] calldata _to, Booster[] calldata _booster, uint8[] calldata _number) external;

    function createBooster(address _to, uint8 _gemType, Booster _booster) external;

    function removeBooster(address _to, uint8 _gemType, Booster _booster) external;

    function getBooster(address _to, uint8 _gemType, Booster _booster) external view returns (uint256);

    function setBooster(uint256 _tokenId, Booster _booster) external;

    /**
 * @notice Get detailed status of the Gem, including financial details
    * @param _tokenId gem Id
    * @return Gem structure with all the details, excluding the gem type and protocol configuration, which is returned by IConfig facet
    */
    function getGemInfo(uint256 _tokenId) external view returns (Gem memory);

    /**
    * @notice Lists gem IDs the requester holds
    * @return array with token Ids
    */
    function getGemIds() external view returns (uint256[] memory);

    /**
    * @notice Lists gem IDs of a user
    * @param _user gemHolder to get gemsOf
    * @return array with token Ids
    */
    function getGemIdsOf(address _user) external view returns (uint256[] memory);


    /**
    * @notice Get detailed status of all the yield gems the requester holds
    * @return array of the Ids and array of the Gem structurs
    */
    function getGemsInfo() external view returns (uint256[] memory, Gem[] memory);

    /**
    * @notice Checks mint limitations which is both count limit and time limit and
    * @return if the mint is available for the gem type
    */
    function isMintAvailable(uint8 _gemTypeId) external view returns (bool);

    /**
    * @notice mint count limitations details
    * @return GemTypeMintWindow mint window structure
    */
    function getMintWindow(uint8 _gemTypeId) external view returns (GemTypeMintWindow memory);


}
