// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.15;

import "../interfaces/IConfig.sol";
import "../base-facet/BaseFacet.sol";
import "../libraries/LibAppStorage.sol";
import "../libraries/LibPauser.sol";
import "../libraries/LibMintLimiter.sol";
import "../libraries/PercentHelper.sol";

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
        delete s.gemTypesMintWindows;
        for (uint gemTypeId = 0; gemTypeId < _gemTypeConfig.length; gemTypeId++) {
            GemTypeConfig memory cur = _gemTypeConfig[gemTypeId];
            s.gemTypes.push(cur);
            GemTypeMintWindow memory initWindow = GemTypeMintWindow(0, uint32(block.timestamp));
            s.gemTypesMintWindows.push(initWindow);
        }
    }

    function setConfigWallets(address[WALLETS] memory _wallets) external onlyOwner {
        s.config.wallets = _wallets;
    }

    function setConfigIncomeDistributionOnMint(uint256[PAYMENT_RECEIVERS][PAYMENT_TOKENS] memory _incomeDistributionOnMint) external onlyOwner {
        s.config.incomeDistributionOnMint = _incomeDistributionOnMint;
    }

    function setConfigMaintenancePeriod(uint32 _maintenancePeriod) external onlyOwner {
        s.config.maintenancePeriod = _maintenancePeriod;
    }

    function setConfigRewardPeriod(uint32 _rewardPeriod) external onlyOwner {
        s.config.rewardPeriod = _rewardPeriod;
    }

    function setConfigTaxScaleSinceLastClaimPeriod(uint32 _taxScaleSinceLastClaimPeriod) external onlyOwner {
        s.config.taxScaleSinceLastClaimPeriod = _taxScaleSinceLastClaimPeriod;
    }

    function setConfigTaxRates(uint256[TAX_TIERS] memory _taxRates) external onlyOwner {
        s.config.taxRates = _taxRates;
    }

    function setConfigTaxScaleSinceLastClaimPeriod(uint256 _charityContributionRate) external onlyOwner {
        s.config.charityContributionRate = _charityContributionRate;
    }

    function setConfigVaultWithdrawalTaxRate(uint256 _vaultWithdrawalTaxRate) external onlyOwner {
        s.config.vaultWithdrawalTaxRate = _vaultWithdrawalTaxRate;
    }

    function setConfigTaperRate(uint256 _taperRate) external onlyOwner {
        s.config.taperRate = _taperRate;
    }

    function setConfigMintLimitWindow(uint32 _mintLimitWindow) external onlyOwner {
        s.config.mintLimitWindow = _mintLimitWindow;
    }

    function setConfigDefoTokenLimitConfig(DefoTokenLimitConfig calldata _defoTokenLimitConfig) external onlyOwner {
        DefoTokenLimitConfig memory temp = _defoTokenLimitConfig;
        s.config.defoTokenLimitConfig = temp;
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
