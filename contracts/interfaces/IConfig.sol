// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.9;
import "./IDataStructures.sol";


/** @title  IConfig EIP-2535 Diamond Facet
  * @author Decentralized Foundation Team
  * @notice The Yield Gem Configuration, setters and getters
*/
interface IConfig {

    function setConfig(ProtocolConfig calldata _config) external;

    function getConfig() external view returns (ProtocolConfig memory);

    function setGemTypeConfig(uint8 _gemTypeId, GemTypeConfig calldata _gemTypeConfig) external;

    function getGemTypeConfig(uint8 _gemTypeId) external view returns (GemTypeConfig memory);

    function lockMint() external;

    function unlockMint() external;

    function pause() external;

    function unpause() external;

}
