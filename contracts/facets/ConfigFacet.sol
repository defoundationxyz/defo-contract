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
        delete s.gemTypes2;
        delete s.gemTypesMintWindows;
        for (uint gemTypeId = 0; gemTypeId < _gemTypeConfig.length; gemTypeId++) {
            GemTypeConfig memory cur = _gemTypeConfig[gemTypeId];
            s.gemTypes2.push(cur);
            GemTypeMintWindow memory initWindow = GemTypeMintWindow(0, uint32(block.timestamp));
            s.gemTypesMintWindows.push(initWindow);
        }
    }

    function setMaintenanceReductionTable(MaintenanceFeeReductionRecord[] calldata _maintenanceFeeReductionTable) external onlyOwner {
        // fill in the storage and reset mint limit window counter for every gem type
        delete s.maintenanceFeeReductionTable;
        for (uint i = 0; i < _maintenanceFeeReductionTable.length; i++) {
            MaintenanceFeeReductionRecord memory cur = _maintenanceFeeReductionTable[i];
            s.maintenanceFeeReductionTable.push(cur);
        }
    }


    function setConfigWallets(address[WALLETS] memory _wallets) external onlyOwner {
        s.config.wallets = _wallets;
        IERC20 defo = s.config.paymentTokens[uint(PaymentTokens.Defo)];
        defo.approve(s.routerWallet, type(uint256).max);
    }

    function approveDefoForRouter(address _routerWallet) external onlyOwner {
        s.routerWallet = _routerWallet;
        IERC20 defo = s.config.paymentTokens[uint(PaymentTokens.Defo)];
        defo.approve(s.routerWallet, type(uint256).max);
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

    function setCharityContributionRate(uint256 _charityContributionRate) external onlyOwner {
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


    function getConfig() external view returns (ProtocolConfig memory) {
        return s.config;
    }

    function getGemTypesConfig() external view returns (GemTypeConfig[] memory) {
        return s.gemTypes2;
    }

    function getMaintenanceReductionTable() external view returns (MaintenanceFeeReductionRecord[] memory) {
        return s.maintenanceFeeReductionTable;
    }


    function zeroMintCount(uint8 _gemTypeId) external onlyOwner {
        AppStorage storage s = LibAppStorage.diamondStorage();
        GemTypeMintWindow storage windowStorage = s.gemTypesMintWindows[_gemTypeId];
        windowStorage.mintCount = 0;
    }

    function setP2CutOverTime(uint256 _p2CutOverTime) external onlyOwner {
        s.p2CutOverTime = _p2CutOverTime;
    }

    function setP2Finance(uint256 _daiToDistribute, uint256 _totalROT) external onlyOwner {
        s.daiToDistribute = _daiToDistribute;
        s.totalROT = _totalROT;
    }

    function getP2Finance() external view returns (uint256, uint256) {
        return (s.daiToDistribute, s.totalROT);
    }

    function getTotals() external onlyOwner view returns (Fi memory)  {
        AppStorage storage s = LibAppStorage.diamondStorage();
        return s.total;
    }

    function getTotal(address _user) external onlyOwner view returns (Fi memory)  {
        AppStorage storage s = LibAppStorage.diamondStorage();
        return s.usersFi[_user];
    }

    function getP2CutOverTime() public view returns (uint256){
        return s.p2CutOverTime;
    }

    function getP2DaiReceived(address user) public view returns (uint256){
        return s.phase2DaiReceived[user];
    }

    function getP2DepositedToVault(address user) public view returns (uint256){
        return s.phase2DepositedToVault[user];
    }

    function getMyP2DaiReceived() external view returns (uint256){
        address user = _msgSender();
        return getP2DaiReceived(user);
    }

    function getMyP2DepositedToVault() external view returns (uint256){
        address user = _msgSender();
        return getP2DepositedToVault(user);
    }

}
