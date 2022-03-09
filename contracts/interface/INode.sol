//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface INode {
    enum NodeType{ Ruby, Sapphire, Diamond}

    function _distributePayment() external; 

    function _rewardTax(uint256 _tokenid) external view returns (uint256); 

    /// @dev main reward calculation and transfer function probably will changed in the future all rates are daily rates
    function _sendRewardTokens(uint256 _tokenid) external;

    function _sendRewardTokensWithOffset(uint256 _tokenid, uint256 _offset) external; 

    function _compound(uint256 _tokenid) external; 

    function _upgrade(uint256[] memory _tokenids) external; 

    // TODO: Add grace period
    function _maintenance(uint256 _tokenid) external; 

    function _maintenanceUpfront(uint256 _tokenid, uint256 _days) external; 

    // Public Functions

    function RedeemMint(NodeType _type, address to) external; 

    /// @notice mint a new node
    function MintNode() external; 

    function ClaimRewards(uint256 _tokenid) external; 

    function ClaimRewardsAll() external; 

    function Maintenance(uint256 _tokenid) external; 

    function MaintenanceAll() external; 

    function MaintenanceUpfront(uint256 _tokenid, uint256 _days) external; 

    function MaintenanceUpfrontAll(uint256 _days) external; 

    function Compound(uint256 _tokenid) external; 

    function CompoundAll() external; 

    function AddModifier(uint256 _tokenid) external; 

    // View Functions
    function isActive(uint256 _tokenid) external view returns (bool); 

    function checkReward(uint256 _tokenid) external view returns (uint256 defoRewards, uint256 daiRewards);

    function checkPendingMaintenance(uint256 _tokenid) external view returns (uint256);

    function getNodeIdsOf(address _user) external view returns (uint256[] memory);

    // Owner Functions
    function SetNodePrice(uint256 _daiPrice, uint256 _defoPrice) external; 

    function SetTax() external; 

    function ChangePaymentToken(address _newToken) external; 

    function EmergencyMode() external; 

    function ToggleLock() external; 

    function TransferLock() external; 

    // The following functions are overrides required by Solidity.

    function supportsInterface(bytes4 interfaceId) external view returns (bool);

    /// @dev lock transfer
    function _transfer(address from, address to, uint256 tokenId) external; 

    function _beforeTokenTransfer(address from, address to, uint256 tokenId) external; 
}