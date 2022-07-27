// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.9;

import "../interfaces/IConfig.sol";
import "../base-facet/BaseFacet.sol";
import "../libraries/LibAppStorage.sol";
import "../libraries/LibMintLimitManager.sol";
import "../libraries/PercentHelper.sol";
import "../erc721-facet/ERC721AutoIdMinterLimiterBurnableEnumerablePausableFacet.sol";

/** @title  ERC721Facet EIP-2535 Diamond Facet
  * @author Decentralized Foundation Team
  * @notice The Contract uses diamond storage providing functionality of ERC721, ERC721Enumerable, ERC721Burnable, ERC721Pausable
*/
contract ConfigFacet is BaseFacet, IConfig {

    /* ======================== Events ======================= */

    event ConfigurationChange(ProtocolConfig config);
    event GemTypeConfigurationChange(GemTypeConfig _gemTypeConfig);

    /* ============ External and Public Functions ============ */
    function setConfig(ProtocolConfig calldata _config) external {
        s.config = _config;
        emit ConfigurationChange(_config);
    }

    function setGemTypeConfig(uint8 _gemTypeId, GemTypeConfig calldata _gemTypeConfig) external {
        // LibMintLimitManager.initialize();
    }

    function getConfig() external view returns (ProtocolConfig memory) {
        return s.config;
    }

    function getGemTypeConfig(uint8 _gemTypeId) external view returns (GemTypeConfig memory) {

    }

    function lockMint() public {
        LibMintLimitManager.lockMint();
    }

    function unlockMint() public {
        LibMintLimitManager.unlockMint();
    }

    function pause() external {
        _pause();
    }

    function unpause() external {
        _unpause();
    }

}
