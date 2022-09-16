// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.15;

import "@openzeppelin/contracts/token/ERC721/presets/ERC721PresetMinterPauserAutoId.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

/** @title  IYieldGem, EIP-2535 Diamond Facet
  * @author Decentralized Foundation Team
  * @notice Donations Facet
*/
interface IDonations {
    event Donated(address indexed user, uint256 amount);

    /**
    *   @notice amount donated by the sender for all time
    *   @return amount in DEFO (in wei precision)
    */
    function getTotalDonated() external view returns (uint256);
    /**
    *   @notice amount donated by a user for all time
    *   @param _user user to query info for
    *   @return amount in DEFO (in wei precision)
    */
    function getTotalDonatedOf(address _user) external view returns (uint256);

    /**
    *   @notice amount donated by all the users for all time
    *   @return amount in DEFO (in wei precision)
    */
    function getTotalDonatedAllUsers() external view returns (uint256);

}
