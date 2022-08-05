// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.15;

import "../interfaces/IConfig.sol";
import "../base-facet/BaseFacet.sol";
import "../libraries/LibAppStorage.sol";
import "../libraries/LibPauser.sol";
import "../libraries/LibMintLimiter.sol";
import "../libraries/PercentHelper.sol";
import "hardhat/console.sol";

/** @title  ERC721Facet EIP-2535 Diamond Facet
  * @author Decentralized Foundation Team
  * @notice The Contract uses diamond storage providing functionality of ERC721, ERC721Enumerable, ERC721Burnable, ERC721Pausable
*/
contract ConfigFacet is BaseFacet, IConfig {

    /* ============ External and Public Functions ============ */

    function setConfig(ProtocolConfig calldata _config) external onlyOwner {
        ProtocolConfig memory calldataToStorage = _config;
        s.config = calldataToStorage;
        console.log("configured", s.config.wallets[0]);
        emit ConfigurationChange(_config);
    }

    function setGemTypesConfig(GemTypeConfig[] calldata _gemTypeConfig) external onlyOwner {
        // fill in the storage and reset mint limit window counter for every gem type
        delete s.gemTypes;
        delete s.gemTypesMintWindows;
        for (uint gemTypeId = 0; gemTypeId < _gemTypeConfig.length; gemTypeId++) {
            GemTypeConfig memory cur = _gemTypeConfig[gemTypeId];
            s.gemTypes.push(cur);
            GemTypeMintWindow memory initWindow = GemTypeMintWindow(0, uint32(block.timestamp));
            s.gemTypesMintWindows.push(initWindow);
        }
    }

    function getConfig() external view returns (ProtocolConfig memory) {
        return s.config;
    }

    function getGemTypesConfig() external view returns (GemTypeConfig[] memory) {
        return s.gemTypes;
    }

    function lockMint() public onlyOwner {
        LibMintLimiter.lockMint();
    }

    function unlockMint() public onlyOwner {
        LibMintLimiter.unlockMint();
    }

    function pause() external onlyOwner {
        LibPauser._pause();
    }

    function unpause() external onlyOwner {
        LibPauser._unpause();
    }

}
