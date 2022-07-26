// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.9;

import "../interfaces/IConfig.sol";
import "../libraries/LibMintLimitManager.sol";
import "../libraries/PercentHelper.sol";
import "../erc721-facet/ERC721MinterLimiterBurnableEnumerablePausableFacet.sol";

/** @title  ERC721Facet EIP-2535 Diamond Facet
  * @author Decentralized Foundation Team
  * @notice The Contract uses diamond storage providing functionality of ERC721, ERC721Enumerable, ERC721Burnable, ERC721Pausable
*/
contract ConfigFacet is IConfig {

    /* ============ External and Public Functions ============ */

    function setConfig(ProtocolConfig calldata _config) external {
//        LibMintLimitManager._initialize()
//initializeERC721Facet hardcode name and
    }

    function getConfig() external pure returns (ProtocolConfig memory) {

    }

    function setGemTypeConfig(GemTypeConfig calldata _gemTypeConfig) external {

    }

    function getGemTypeConfig(uint8 _gemType) external view returns (GemTypeConfig memory) {

    }
    /* ============ Internal Functions ============ */
}
