// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;
// TODO OPTIMIZATION : find a cheaper library
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
/// @dev we need enumerable for compundAll function
// TODO OPTIMIZATION : find a way to write compoundall system without enumerable
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "./interfaces/IERC20.sol";

contract DefoNode is ERC721, AccessControl, ERC721Enumerable, ERC721Burnable {
    // TODO : add events

    using Counters for Counters.Counter;

    uint256 public constant MaintenanceDays = 30;
    Counters.Counter private _tokenIdCounter;
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    IERC20 PaymentToken;
    IERC20 DefoToken;
    mapping(NodeType => uint256) public DefoPrice;
    mapping(NodeType => uint256) public StablePrice;

    /// @dev timestamp of last claimed reward
    mapping(uint256 => uint256) public LastReward;
    /**  @dev timestamp of last maintenance
     *        if maintenance fee is paid upfront the timestamp could show a future time
     */
    mapping(uint256 => uint256) public LastMaintained;
    /// @dev minimum time required to claim rewards in seconds
    uint256 public RewardTime;

    enum NodeType {
        Ruby,
        Sapphire,
        Diamond
    }
    enum NodeModif {
        None,
        Fast,
        Generous
    }
    /// @dev probably will be changed to treasury or distrubitor contract
    address Treasury;

    mapping(uint256 => NodeType) public TypeOf;
    mapping(uint256 => NodeModif) public ModifierOf;

    /// @dev token per second
    // TODO OPTIMIZATION : Using structs for nodes could be better
    mapping(NodeType => uint256) public RewardRate;
    /// @dev maintenance fee is stored as a  daily rate
    mapping(NodeType => uint256) public MaintenanceFee;
    /// @dev upgrade reqs
    mapping(NodeType => uint256) public UpgradeRequirements;
    mapping(NodeType => uint256) public UpgradeTax;
    /// @dev if it's 0 users can create unlimited nodes
    uint256 MaxNodes = 0;
    /// @dev sale lock
    bool Lock;

    /// transfer lock
    bool transferLock;
    modifier SaleLock() {
        require(!Lock, "Sale is Locked");
        _;
    }

    constructor(
        address _redeemContract,
        address _defoToken,
        address _paymentToken,
        address _treasury
    ) ERC721("Defo Node", "Defo Node") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, _redeemContract);
        DefoToken = IERC20(_defoToken);
        PaymentToken = IERC20(_paymentToken);
        Treasury = _treasury;
    }

    // internal functions

    /// @dev sends the node payment to other wallets
    function _distributePayment(NodeType _type) internal {}

    function _rewardTax(uint256 _tokenid) internal {}

    function _sendRewardTokens(uint256 _tokenid) internal {}

    function _compound(uint256 _tokenid) internal {}

    function _upgrade(uint256[] memory _tokenids) internal {
        require(_tokenids.length >= 2, "not enough nodes");
        NodeType firstToCheck = TypeOf[_tokenids[0]];
        require(
            _tokenids.length == UpgradeRequirements[firstToCheck],
            "Token amount is wrong"
        );
        require(firstToCheck != NodeType.Diamond, "Can't upgrade diamond");
        for (uint256 index = 0; index < _tokenids.length; index++) {
            require(
                ownerOf(_tokenids[index]) == msg.sender,
                "You don't own that token"
            );
            require(
                firstToCheck == TypeOf[_tokenids[index]],
                "Token types must be same"
            );
            burn(_tokenids[index]);
        }
        require(
            DefoToken.transferFrom(
                msg.sender,
                Treasury,
                UpgradeTax[firstToCheck]
            ),
            "Payment Failed"
        );
        if (firstToCheck == NodeType.Ruby) {
            uint256 tokenId = _tokenIdCounter.current();
            _tokenIdCounter.increment();
            _safeMint(msg.sender, tokenId);
            TypeOf[tokenId] = NodeType.Sapphire;
            LastReward[tokenId] = block.timestamp;
        } else {
            uint256 tokenId = _tokenIdCounter.current();
            _tokenIdCounter.increment();
            _safeMint(msg.sender, tokenId);
            TypeOf[tokenId] = NodeType.Diamond;
            LastReward[tokenId] = block.timestamp;
        }
    }

    // TODO: Add grace period
    function _maintenance(uint256 _tokenid) internal {
        NodeType _nodeType = TypeOf[_tokenid];
        uint256 _fee = MaintenanceFee[_nodeType];
        uint256 _lastTime = LastMaintained[_tokenid];
        require(_lastTime < block.timestamp, "upfront is paid already");
        // TODO TEST : check for possible calculation errors
        uint256 _passedDays = (block.timestamp - _lastTime) / 60 / 60 / 24;
        require(_passedDays > MaintenanceDays, "Too soon");
        uint256 _amount = _passedDays * _fee;
        require(
            PaymentToken.balanceOf(msg.sender) > _amount,
            "Not enough funds to pay"
        );
        PaymentToken.transferFrom(msg.sender, Treasury, _amount);
        LastMaintained[_tokenid] = block.timestamp;
    }

    function _maintenanceUpfront(uint256 _tokenid, uint256 _days) internal {
        require(_days > 240, "must be less than 6 months");
        NodeType _nodeType = TypeOf[_tokenid];
        uint256 _fee = MaintenanceFee[_nodeType];
        uint256 _lastTime = LastMaintained[_tokenid];
        require(_lastTime < block.timestamp, "upfront is paid already");
        uint256 _passedDays = (block.timestamp - _lastTime) / 60 / 60 / 24;
        _passedDays = _passedDays + _days;
        uint256 _amount = _passedDays * _fee;
        require(
            PaymentToken.balanceOf(msg.sender) > _amount,
            "Not enough funds to pay"
        );
        PaymentToken.transferFrom(msg.sender, Treasury, _amount);
        uint256 offset = 60 * 60 * 24 * _days;
        LastMaintained[_tokenid] = block.timestamp + offset;
    }

    // Public Functions

    function RedeemMint(address to) public onlyRole(MINTER_ROLE) {
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        _safeMint(to, tokenId);
    }

    /// @notice mint a new node
    function MintNode(NodeType _type) external SaleLock {
        if (MaxNodes != 0) {
            require(_tokenIdCounter.current() < MaxNodes, "Sold Out");
        }
        require(
            DefoToken.balanceOf(msg.sender) > DefoPrice[_type],
            "Insufficient Defo"
        );
        require(
            PaymentToken.balanceOf(msg.sender) > StablePrice[_type],
            "Insufficient USD"
        );
        _distributePayment(_type);
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        _safeMint(msg.sender, tokenId);
        TypeOf[tokenId] = _type;
        LastReward[tokenId] = block.timestamp;
    }

    function ClaimRewards(uint256 _tokenid) external {
        require(isActive(_tokenid), "Node is deactivated");
        uint256 rewardPoints = block.timestamp - LastReward[_tokenid];
        require(rewardPoints > RewardTime, "Too soon");
        _sendRewardTokens(_tokenid);
    }

    function ClaimRewardsAll() external {
        require(balanceOf(msg.sender) > 0, "User doesn't have any nodes");
        address account = msg.sender;
        uint256[] memory nodesOwned = getNodeIdsOf(account);
        for (uint256 index = 0; index < nodesOwned.length; index++) {
            uint256 _tokenid = nodesOwned[index];
            uint256 rewardPoints = block.timestamp - LastReward[_tokenid];
            require(rewardPoints > RewardTime, "Too soon");
            require(isActive(_tokenid), "Node is deactivated");
            _sendRewardTokens(_tokenid);
        }
    }

    function Maintenance(uint256 _tokenid) external {
        require(ownerOf(_tokenid) == msg.sender, "You don't own this node");
        _maintenance(_tokenid);
    }

    function MaintenanceAll() external {
        require(balanceOf(msg.sender) > 0, "User doesn't have any nodes");
        address account = msg.sender;
        uint256[] memory nodesOwned = getNodeIdsOf(account);
        for (uint256 index = 0; index < nodesOwned.length; index++) {
            uint256 _tokenid = nodesOwned[index];
            _maintenance(_tokenid);
        }
    }

    function MaintenanceUpfront(uint256 _tokenid, uint256 _days) external {
        require(ownerOf(_tokenid) == msg.sender, "You don't own this node");
        _maintenanceUpfront(_tokenid, _days);
    }

    function MaintenanceUpfrontAll(uint256 _days) external {
        require(balanceOf(msg.sender) > 0, "User doesn't have any nodes");
        address account = msg.sender;
        uint256[] memory nodesOwned = getNodeIdsOf(account);
        for (uint256 index = 0; index < nodesOwned.length; index++) {
            uint256 _tokenid = nodesOwned[index];
            _maintenanceUpfront(_tokenid, _days);
        }
    }

    function Compound(uint256 _tokenid) external {
        require(ownerOf(_tokenid) == msg.sender, "You don't own this node");
        _compound(_tokenid);
    }

    function CompoundAll() external {
        require(balanceOf(msg.sender) > 0, "User doesn't have any nodes");
        address account = msg.sender;
        uint256[] memory nodesOwned = getNodeIdsOf(account);
        for (uint256 index = 0; index < nodesOwned.length; index++) {
            _compound(nodesOwned[index]);
        }
    }

    function AddModifier(uint256 _tokenid, NodeModif _modifier) external {
        require(
            ModifierOf[_tokenid] == NodeModif.None,
            "Node already has a modifier"
        );
        ModifierOf[_tokenid] = _modifier;
    }

    // View Functions
    function isActive(uint256 _tokenid) public view returns (bool) {
        uint256 _lastTime = LastMaintained[_tokenid];
        uint256 _passedDays = (block.timestamp - _lastTime) / 60 / 60 / 24;

        return !(_passedDays > MaintenanceDays);
    }

    function checkReward(uint256 _tokenid)
        public
        view
        returns (uint256 defoRewards, uint256 daiRewards)
    {}

    function checkPendingMaintenance(uint256 _tokenid)
        public
        view
        returns (uint256)
    {}

    function getNodeIdsOf(address _user)
        public
        view
        returns (uint256[] memory)
    {
        uint256 numberOfNodes = balanceOf(_user);
        uint256[] memory nodeIds = new uint256[](numberOfNodes);
        for (uint256 i = 0; i < numberOfNodes; i++) {
            uint256 nodeId = tokenOfOwnerByIndex(_user, i);
            require(_exists(nodeId), "This node doesn't exists");
            nodeIds[i] = nodeId;
        }
        return nodeIds;
    }

    // Owner Functions

    function SetTax() external onlyRole(DEFAULT_ADMIN_ROLE) {}

    function ChangePaymentToken(address _newToken)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        PaymentToken = IERC20(_newToken);
    }

    function EmergencyMode() external onlyRole(DEFAULT_ADMIN_ROLE) {}

    function ToggleLock() external onlyRole(DEFAULT_ADMIN_ROLE) {
        Lock = !Lock;
    }

    function TransferLock() external onlyRole(DEFAULT_ADMIN_ROLE) {
        transferLock = !transferLock;
    }

    // The following functions are overrides required by Solidity.

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, AccessControl, ERC721Enumerable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    /// @dev lock transfer
    function _transfer(
        address from,
        address to,
        uint256 tokenId
    ) internal override {
        require(!transferLock, "Transfer is forbidden");
        super._transfer(from, to, tokenId);
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId
    ) internal override(ERC721, ERC721Enumerable) {
        super._beforeTokenTransfer(from, to, tokenId);
    }
}
