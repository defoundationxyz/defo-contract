// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.15;

import "../data-types/IDataTypes.sol";

/** @title  IYieldGem, EIP-2535 Diamond Facet
  * @author Decentralized Foundation Team
  * @notice The Yield Gem getters and booster functions
*/
interface IGetter {
    function createBooster(address _to, uint8 _gemType, Booster _booster) external;

    function removeBooster(address _to, uint8 _gemType, Booster _booster) external;

    function getBooster(address _to, uint8 _gemType, Booster _booster) external view returns (uint256);

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
