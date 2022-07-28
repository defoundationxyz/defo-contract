// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.15;

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

    /* ============ External and Public Functions ============ */

    function setConfig(ProtocolConfig calldata _config) external onlyOwner {
        ProtocolConfig memory calldataToStorage = _config;
        s.config = calldataToStorage;
        emit ConfigurationChange(_config);
    }

    function setGemTypesConfig(GemTypeConfig[] calldata _gemTypeConfig) external onlyOwner {
        // fill in the storage and reset mint limit window counter for every gem type
        delete s.gemTypes;
        for (uint8 gemTypeId = 0; gemTypeId < uint8(_gemTypeConfig.length); gemTypeId++) {
            s.gemTypes.push(_gemTypeConfig[gemTypeId]);
            LibMintLimitManager.initialize(gemTypeId);
        }
    }

    function getConfig() external view returns (ProtocolConfig memory) {
        return s.config;
    }

    function getGemTypesConfig() external view returns (GemTypeConfig[] memory) {
        return s.gemTypes;
    }

    function lockMint() public onlyOwner {
        LibMintLimitManager.lockMint();
    }

    function unlockMint() public onlyOwner {
        LibMintLimitManager.unlockMint();
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

}
