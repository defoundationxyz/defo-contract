// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

/// @title privileged operations facet
/// @author jvoljvolizka

import "../libraries/LibDiamond.sol";
import "../libraries/LibGem.sol";
import "../libraries/LibMeta.sol";
import "hardhat/console.sol";

contract OwnerFacet {
    // Owner Functions

    modifier onlyOwner() {
        require(LibMeta.msgSender() == LibDiamond.contractOwner());
        _;
    }

    function initialize(
        address _redeemContract,
        address _defoToken,
        address _paymentToken,
        address _treasury,
        address _limiter,
        address _rewardPool,
        address _donation
    ) external onlyOwner {
        console.log("OwnerFacet initialized");
        LibMeta.DiamondStorage storage metads = LibMeta.diamondStorage();
        LibGem.DiamondStorage storage gemds = LibGem.diamondStorage();
        gemds.MinterAddr = _redeemContract;
        metads.DefoToken = IERC20Joe(_defoToken);
        metads.PaymentToken = IERC20Joe(_paymentToken);
        metads.Treasury = _treasury;
        metads.LimiterAddr = _limiter;
        metads.RewardPool = _rewardPool;
        metads.Donation = _donation;
    }

    /// @notice function for creating a new gem type or changing a gem type settings
    function setGemSettings(
        uint8 _type,
        LibGem.GemTypeMetadata calldata _gemData
    ) external onlyOwner {
        LibGem.DiamondStorage storage ds = LibGem.diamondStorage();
        ds.GetGemTypeMetadata[_type] = _gemData;
    }

    /// @notice functions for setting distribution addresses
    function setAddressAndDistTreasury(address _newAddress, uint256 _daiRate)
        external
        onlyOwner
    {
        LibMeta.DiamondStorage storage metads = LibMeta.diamondStorage();
        metads.Treasury = _newAddress;
        metads.TreasuryDaiRate = _daiRate;
    }

    function setAddressAndDistRewardPool(address _newAddress, uint256 _defoRate)
        external
        onlyOwner
    {
        LibMeta.DiamondStorage storage metads = LibMeta.diamondStorage();
        metads.RewardPool = _newAddress;
        metads.RewardPoolDefoRate = _defoRate;
    }

    function setAddressDonation(address _newAddress, uint256 _rate)
        external
        onlyOwner
    {
        LibMeta.DiamondStorage storage metads = LibMeta.diamondStorage();
        metads.Donation = _newAddress;
        metads.CharityRate = _rate;
    }

    function setAddressAndDistTeam(
        address _newAddress,
        uint256 _daiRate,
        uint256 _defoRate
    ) external onlyOwner {
        LibMeta.DiamondStorage storage metads = LibMeta.diamondStorage();
        metads.Team = _newAddress;
        metads.TreasuryDefoRate = _defoRate;
        metads.TreasuryDaiRate = _daiRate;
    }

    function setAddressAndDistLiquidity(
        address _newAddress,
        uint256 _defoRate,
        uint256 _daiRate
    ) external onlyOwner {
        LibMeta.DiamondStorage storage metads = LibMeta.diamondStorage();
        metads.Liquidity = _newAddress;
        metads.LiquidityDefoRate = _defoRate;
        metads.LiquidityDaiRate = _daiRate;
    }

    function setAddressVault(address _newAddress) external onlyOwner {
        LibMeta.DiamondStorage storage metads = LibMeta.diamondStorage();
        metads.Vault = _newAddress;
    }

    function setBaseURI(string calldata _newBaseURI) external onlyOwner {
        LibERC721.DiamondStorage storage ds = LibERC721.diamondStorage();
        ds.baseURI = _newBaseURI;
    }

    function setMinterAddress(address _newMinterAddress) external onlyOwner {
        LibGem.DiamondStorage storage ds = LibGem.diamondStorage();
        ds.MinterAddr = _newMinterAddress;
    }

    function setLimiterAddress(address _newLimiterAddress) external onlyOwner {
        LibERC721.DiamondStorage storage ds = LibERC721.diamondStorage();
        ds.Limiter = _newLimiterAddress;
    }

    function setMinReward(uint256 _minReward) external onlyOwner {
        LibMeta.DiamondStorage storage metads = LibMeta.diamondStorage();
        metads.MinReward = _minReward;
    }

    function setMinRewardTime(uint256 _minRewardTime) external onlyOwner {
        LibMeta.DiamondStorage storage metads = LibMeta.diamondStorage();
        metads.RewardTime = _minRewardTime;
    }

    function setMintLimitHours(uint8 _MintLimitHours) external onlyOwner {
        LibMeta.DiamondStorage storage metads = LibMeta.diamondStorage();
        metads.MintLimitHours = _MintLimitHours;
    }

    function ChangePaymentToken(address _newToken) external onlyOwner {
        LibMeta.DiamondStorage storage metads = LibMeta.diamondStorage();
        metads.PaymentToken = IERC20Joe(_newToken);
    }

    function setTaperRate(uint256 _rate) external onlyOwner {
        LibGem.DiamondStorage storage gemds = LibGem.diamondStorage();
        gemds.taperRate = _rate;
    }

    function setRewardTax(uint256[] memory _rewardTaxTable) external onlyOwner {
        LibMeta.DiamondStorage storage metads = LibMeta.diamondStorage();
        metads.RewardTaxTable = _rewardTaxTable;
    }

    //function EmergencyMode() external onlyRole(DEFAULT_ADMIN_ROLE) {}

    function ToggleSaleLock() external onlyOwner {
        LibMeta.DiamondStorage storage metads = LibMeta.diamondStorage();
        metads.Lock = !metads.Lock;
    }

    function ToggleTransferLock() external onlyOwner {
        LibMeta.DiamondStorage storage metads = LibMeta.diamondStorage();
        metads.transferLock = !metads.transferLock;
    }
}
