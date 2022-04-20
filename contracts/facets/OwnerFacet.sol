// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

/// @title privileged operations facet
/// @author jvoljvolizka

import "../libraries/LibDiamond.sol";
import "../libraries/LibGem.sol";
import "../libraries/LibMeta.sol";

contract OwnerFacet {
    // Owner Functions

    modifier onlyOwner() {
        require(LibMeta.msgSender() == LibDiamond.contractOwner());
        _;
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
    function setAddressRewardPool(address _newAddress) external onlyOwner {
        LibMeta.DiamondStorage storage metads = LibMeta.diamondStorage();
        metads.RewardPool = _newAddress;
    }

    function setAddressDonation(address _newAddress) external onlyOwner {
        LibMeta.DiamondStorage storage metads = LibMeta.diamondStorage();
        metads.Donation = _newAddress;
    }

    function setAddressTeam(address _newAddress) external onlyOwner {
        LibMeta.DiamondStorage storage metads = LibMeta.diamondStorage();
        metads.Team = _newAddress;
    }

    function setAddressMarketing(address _newAddress) external onlyOwner {
        LibMeta.DiamondStorage storage metads = LibMeta.diamondStorage();
        metads.Marketing = _newAddress;
    }

    function setAddressBuyback(address _newAddress) external onlyOwner {
        LibMeta.DiamondStorage storage metads = LibMeta.diamondStorage();
        metads.Buyback = _newAddress;
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
