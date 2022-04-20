// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

/// @title privileged operations facet
/// @author jvoljvolizka

import "../libraries/LibDiamond.sol";
import "../libraries/LibGem.sol";
import "../libraries/LibMeta.sol";

contract OwnerFacet {
    // Owner Functions
    // TODO: set input to  GemTypeMetadata struct
    /// @notice function for creating a new gem type or changing a gem type settings settings should sent as an array with a spesific order
    /// @dev required order is : [DefoPrice , StablePrice , MaintenanceFee , RewardRate , DailyLimit ]
    modifier onlyOwner() {
        require(LibMeta.msgSender() == LibDiamond.contractOwner());
        _;
    }

    function setGemSettings(uint8 _type, uint256[] calldata _settingsArray)
        external
        onlyOwner
    {
        require(
            _settingsArray.length >= 5,
            "Settings array length must be greater than 5"
        );
        LibGem.DiamondStorage storage ds = LibGem.diamondStorage();
        LibGem.GemTypeMetadata storage gemType = ds.GetGemTypeMetadata[_type];
        gemType.DefoPrice = _settingsArray[0];
        gemType.StablePrice = _settingsArray[1];
        gemType.MaintenanceFee = uint16(_settingsArray[2]);
        gemType.RewardRate = uint16(_settingsArray[3]);
        gemType.DailyLimit = uint8(_settingsArray[4]);
    }

    /// @notice function for setting distribution addresses
    /// @dev required order is : [RewardPool , LimiterAddr , Donation , Team , Marketing ,  Buyback]
    function setAddresses(address[] calldata _addressArray) external onlyOwner {
        require(
            _addressArray.length >= 6,
            "Settings array length must be greater than 5"
        );
        LibMeta.DiamondStorage storage metads = LibMeta.diamondStorage();
        metads.RewardPool = _addressArray[0];
        metads.LimiterAddr = _addressArray[1];
        metads.Donation = _addressArray[2];
        metads.Team = _addressArray[3];
        metads.Marketing = _addressArray[4];
        metads.Buyback = _addressArray[5];
    }

    function setMinReward(uint256 _minReward) external onlyOwner {
        LibMeta.DiamondStorage storage metads = LibMeta.diamondStorage();
        metads.MinReward = _minReward;
    }

    function setMintLimitHours(uint8 _MintLimitHours) external onlyOwner {
        LibMeta.DiamondStorage storage metads = LibMeta.diamondStorage();
        metads.MintLimitHours = _MintLimitHours;
    }

    function ChangePaymentToken(address _newToken) external onlyOwner {
        LibMeta.DiamondStorage storage metads = LibMeta.diamondStorage();
        metads.PaymentToken = IERC20(_newToken);
    }

    function setDistirbution(address _targetAddress, uint256 _ratio)
        external
        onlyOwner
    {
        LibMeta.DiamondStorage storage metads = LibMeta.diamondStorage();
        metads.DistTable[_targetAddress] = _ratio;
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
