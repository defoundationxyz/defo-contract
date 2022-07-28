// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.15;

/** @title  IMaintenance EIP-2535 Diamond Facet
  * @author Decentralized Foundation Team
  * @notice Maintenance interface: fee calculation, payment, events
*/
interface IMaintenance {
    event MaintenancePaid(address _user, uint256 _tokenId, uint256 _feeToPay);

    /**
    * @notice Pays for maintenance till block.timestamp, also allowing to pay for someone else since no check if a caller is the owner of the gem
    * @param _tokenId gem Id
    */
    function maintain(uint256 _tokenId) external;

    function batchMaintain(uint256[] calldata _tokenIds) external;

    function getPendingMaintenanceFee(uint256 _tokenId) external view returns (uint256);

}
