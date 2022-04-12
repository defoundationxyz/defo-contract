// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "hardhat/console.sol";
// TODO OPTIMIZATION : find a cheaper library
import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
/// @dev we need enumerable for compundAll function
// TODO OPTIMIZATION : find a way to write compoundall system without enumerable

import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721EnumerableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721BurnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "./interfaces/IERC20.sol";

interface ILimiter {
    function transferLog(
        address to,
        address from,
        uint256 tokenid
    ) external returns (bool);
}

contract DefoNode is
    Initializable,
    ERC721Upgradeable,
    ERC721EnumerableUpgradeable,
    ERC721BurnableUpgradeable,
    AccessControlUpgradeable
{
    // TODO : add events

    using Counters for Counters.Counter;

    uint256 public constant MaintenanceDays = 30;
    Counters.Counter private _tokenIdCounter;
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    IERC20 PaymentToken;
    IERC20 DefoToken;
    mapping(address => uint256) public DistTable;
    uint256[] public RewardTaxTable;
    uint256 minReward = 0;

    /// @dev minimum time required to claim rewards in seconds
    uint256 public RewardTime;
    uint8 public MintLimitHours;
    /// @dev Main node struct packed for efficency
    struct Node {
        uint32 MintTime; // timestamp of the mint time
        uint32 LastReward; // timestamp of last reward claim
        uint32 LastMaintained; // timestamp of last maintenance (could be a date in the future in case of upfront payment)
        uint8 NodeType; // node type right now 0 -> Ruby , 1 -> Sapphire and 2 -> Diamond
        uint8 TaperCount; // Count of how much taper applied
        /// @dev i'm not sure if enums are packed as uint8 in here
        NodeModif Modifier; // Node Modifier 0 -> None , 1 -> Fast , 2 -> Generous
        Booster Booster; // Node Boosyer 0 -> None , 1 -> Delta , 2 -> Omega
        uint256 claimedReward; // previously claimed rewards
    }

    /// @dev A struct for keeping info about node types
    struct NodeTypeMetadata {
        uint32 LastMint; // last mint timestamp
        uint16 MaintenanceFee; // Maintenance fee for the node type written and calculated as a percentage of DefoPrice so it can be maximum 1000
        uint16 RewardRate; // Reward rate  for the node type written and calculated as a percentage of DefoPrice so it can be maximum 1000
        uint8 DailyLimit; // global mint limit for a node type
        uint8 MintCount; // mint count resets every MintLimitHours hours
        uint256 DefoPrice; // Required Defo tokens while minting
        uint256 StablePrice; // Required StableCoin tokens while minting
    }

    /// @dev a struct for keeping info and state about users
    struct UserData {
        mapping(uint8 => uint8) OmegaClaims; // Remaining Omega booster claims of the user
        mapping(uint8 => uint8) DeltaClaims; // Remaining Delta
        bool blacklisted; // Whether the user is blacklisted or not
    }

    mapping(uint256 => Node) public NodeOf; // tokenid -> node struct mapping
    mapping(address => UserData) public GetUserData; // user address -> UserData struct mapping
    mapping(uint8 => NodeTypeMetadata) public GetNodeTypeMetadata; // node type id -> metadata mapping

    enum NodeModif {
        None,
        Fast,
        Generous
    }
    enum Booster {
        None,
        Delta,
        Omega
    }

    /// @dev probably will be changed to treasury or distrubitor contract
    address Treasury;
    address RewardPool;
    address LimiterAddr;
    address Team;
    address Marketing;
    address Donation;
    address Buyback;

    address[] GenerousityList;

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

    function initialize(
        address _redeemContract,
        address _defoToken,
        address _paymentToken,
        address _treasury,
        address _limiter,
        address _rewardPool
    ) public initializer {
        __ERC721_init("Defo Node", "Defo Node");
        __ERC721Enumerable_init();
        __ERC721Burnable_init();
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, _redeemContract);
        DefoToken = IERC20(_defoToken);
        PaymentToken = IERC20(_paymentToken);
        Treasury = _treasury;
        LimiterAddr = _limiter;
        RewardPool = _rewardPool;
    }

    modifier onlyNodeOwner(uint256 _tokenId) {
        require(ownerOf(_tokenId) == msg.sender, "You don't own this node");
        _;
    }

    modifier onlyActive(uint256 _tokenId) {
        require(isActive(_tokenId), "Node is deactivated");
        _;
    }

    modifier mintTimeLimit(uint8 _nodeType) {
        NodeTypeMetadata memory nodeType = GetNodeTypeMetadata[_nodeType];
        require(
            block.timestamp - nodeType.LastMint >= 1 hours * MintLimitHours ||
                nodeType.MintCount <= nodeType.DailyLimit,
            "Node mint restriction"
        );
        _;
    }

    // internal functions

    /// calculates the reward taper with roi after 1x everytime roi achived rewards taper by %30
    /// could be more optimized
    /// always calculates rewards from 0
    function _taperCalculate(
        uint256 _tokenId /*, bool _update*/
    ) internal view returns (uint256) {
        Node memory node = NodeOf[_tokenId];
        NodeTypeMetadata memory nodeType = GetNodeTypeMetadata[node.NodeType];
        uint256 rewardCount = checkRawReward(_tokenId) + node.claimedReward; // get reward without taper
        uint256 actualReward = 0;

        uint256 typePrice = nodeType.DefoPrice;
        uint256 fastMilestone = typePrice + (typePrice / 2); // 1.5x roi for degen modif
        if (rewardCount > typePrice && node.Modifier != NodeModif.Fast) {
            while (rewardCount > typePrice) {
                rewardCount = rewardCount - typePrice;
                actualReward = actualReward + typePrice;
                rewardCount = (((rewardCount) * 80) / 100);
            }
            /// TODO : check for overflows
            return actualReward + rewardCount - node.claimedReward;
        } else if (
            rewardCount >= fastMilestone && node.Modifier == NodeModif.Fast
        ) {
            return fastMilestone - node.claimedReward;
        }
        return checkRawReward(_tokenId) - node.claimedReward; // if less than roi don't taper
    }

    /// @dev sends the node payment to other wallets
    // TODO : LP distribution
    function _distributePayment(uint256 _amount, bool _isDefo) internal {
        uint256 amount = _amount;
        uint256 reward = (amount * DistTable[RewardPool]) / 1000;
        uint256 treasury = (amount * DistTable[Treasury]) / 1000;
        //        uint256 liquidity = (amount * DistTable[Liquidity]) / 1000;
        uint256 marketing = (amount * DistTable[Marketing]) / 1000;
        uint256 team = (amount * DistTable[Team]) / 1000;
        uint256 buyback = (amount * DistTable[Buyback]) / 1000;
        /*
        uint256 reward = (amount * 900) / 1000;
        uint256 treasury = (amount * 800) / 1000;
        uint256 liquidity = (amount * 50) / 1000;
        uint256 marketing = (amount * 25) / 1000;
        uint256 team = (amount * 25) / 1000;
        uint256 buyback = (amount * 100) / 1000;
*/
        IERC20 Token;
        if (_isDefo) {
            treasury = 0;
            buyback = 0;
            Token = DefoToken;
        } else {
            reward = 0;
            buyback = (amount * 100) / 1000;
            Token = PaymentToken;
        }
        Token.transfer(RewardPool, reward);
        Token.transfer(Marketing, marketing);
        Token.transfer(Team, team);
        Token.transfer(Treasury, treasury);
        Token.transfer(Buyback, buyback);
        // TODO : add lp distrubition
    }

    // reward rate changes depending on the time
    function _rewardTax(uint256 _tokenid) internal view returns (uint256) {
        Node memory node = NodeOf[_tokenid];
        uint32 diff = uint32(block.timestamp) - node.LastReward;
        if (diff < 1 weeks) {
            return RewardTaxTable[0];
        } else if (diff > 2 weeks && diff < 3 weeks) {
            return RewardTaxTable[1];
        } else if (diff > 3 weeks && diff < 4 weeks) {
            return RewardTaxTable[2];
        } else {
            return RewardTaxTable[3];
        }
    }

    function _mintNode(uint8 _type, address _to) internal returns (uint256) {
        if (MaxNodes != 0) {
            require(_tokenIdCounter.current() < MaxNodes, "Sold Out");
        }
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        _safeMint(_to, tokenId);
        Node memory node;
        node.NodeType = _type;
        node.LastReward = uint32(block.timestamp);
        node.LastMaintained = uint32(block.timestamp);
        NodeOf[tokenId] = node;
        return tokenId;
    }

    /// @dev main reward calculation and transfer function probably will changed in the future all rates are daily rates
    // TODO : remove tax functions from base node contract
    function _sendRewardTokens(uint256 _tokenid, uint256 _offset) internal {
        uint256 _rewardDefo = _taperCalculate(_tokenid);

        uint256 taxRate = _rewardTax(_tokenid);
        if (taxRate != 0) {
            _rewardDefo = (_rewardDefo - ((taxRate * _rewardDefo) / 1000));
        }
        _rewardDefo = _rewardDefo - _offset;
        DefoToken.transferFrom(Treasury, msg.sender, _rewardDefo);
        Node storage node = NodeOf[_tokenid];
        node.claimedReward = node.claimedReward + _rewardDefo;
        node.LastReward = uint32(block.timestamp);
    }

    // node compounding function creates a node from unclaimed rewards , only creates same type of the compounded node
    function _compound(uint256 _tokenid, uint8 _nodeType)
        internal
        mintTimeLimit(_nodeType)
    {
        Node memory node = NodeOf[_tokenid];
        NodeTypeMetadata storage nodeType = GetNodeTypeMetadata[_nodeType];
        uint256 rewardDefo = _taperCalculate(_tokenid);
        require(rewardDefo >= (nodeType.DefoPrice), "not enough rewards");
        node.claimedReward = node.claimedReward + nodeType.DefoPrice;

        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        _safeMint(msg.sender, tokenId);
        Node memory newNode;
        newNode.NodeType = _nodeType;
        newNode.LastMaintained = uint32(block.timestamp);
        newNode.LastReward = uint32(block.timestamp);
        NodeOf[tokenId] = newNode;
        if (block.timestamp - nodeType.LastMint >= 1 hours * MintLimitHours) {
            nodeType.LastMint = uint32(block.timestamp);
            nodeType.MintCount = 0;
        } else {
            nodeType.MintCount = nodeType.MintCount + 1;
        }
    }

    // TODO: Add grace period
    function _maintenance(uint256 _tokenid, uint256 _days) internal {
        Node storage node = NodeOf[_tokenid];
        NodeTypeMetadata memory nodeType = GetNodeTypeMetadata[node.NodeType];

        uint256 _fee = nodeType.MaintenanceFee;
        uint256 discountRate = _maintenanceDiscount(_tokenid);
        _fee = _fee - ((discountRate * _fee) / 100);
        uint256 _lastTime = node.LastMaintained;
        require(_lastTime < block.timestamp, "upfront is paid already");
        // TODO TEST : check for possible calculation errors
        uint256 _passedDays = (block.timestamp - _lastTime) / 60 / 60 / 24;
        require(_passedDays > MaintenanceDays, "Too soon");
        _passedDays = _passedDays + _days;
        uint256 _amount = _passedDays * _fee;
        require(
            PaymentToken.balanceOf(msg.sender) > _amount,
            "Not enough funds to pay"
        );
        PaymentToken.transferFrom(msg.sender, Treasury, _amount);
        node.LastMaintained =
            uint32(block.timestamp) +
            uint32((_days * 1 days));
    }

    function _maintenanceDiscount(uint256 _tokenid)
        internal
        view
        returns (uint256)
    {
        Node memory node = NodeOf[_tokenid];

        if (node.Booster == Booster.Omega) {
            return 50;
        } else if (node.Booster == Booster.Delta) {
            return 25;
        } else {
            return 0;
        }
    }

    // Public Functions

    function RedeemMint(uint8 _type, address _to) public onlyRole(MINTER_ROLE) {
        _mintNode(_type, _to);
    }

    // TODO : check claims
    function RedeemMintBooster(
        uint8 _type,
        Booster _booster,
        address _to
    ) public onlyRole(MINTER_ROLE) {
        UserData storage userData = GetUserData[msg.sender];
        _mintNode(_type, _to);
        if (_booster == Booster.Omega) {
            userData.OmegaClaims[_type] = userData.OmegaClaims[_type] + 2;
        } else {
            userData.DeltaClaims[_type] = userData.DeltaClaims[_type] + 2;
        }
    }

    function BoostNode(Booster _booster, uint256 _tokenid)
        public
        onlyNodeOwner(_tokenid)
        onlyActive(_tokenid)
    {
        Node storage node = NodeOf[_tokenid];
        require(node.Booster == Booster.None, "Node is already boosted");
        UserData storage userData = GetUserData[msg.sender];
        require(
            userData.OmegaClaims[node.NodeType] > 0 ||
                userData.DeltaClaims[node.NodeType] > 0,
            "Not enough boost claims"
        );
        if (_booster == Booster.Omega) {
            require(
                userData.OmegaClaims[node.NodeType] > 0,
                "Not enough boost claims"
            );
            node.Booster = Booster.Omega;
            userData.OmegaClaims[node.NodeType] =
                userData.OmegaClaims[node.NodeType] -
                1;
        } else {
            require(
                userData.DeltaClaims[node.NodeType] > 0,
                "Not enough boost claims"
            );
            node.Booster = Booster.Delta;
            userData.DeltaClaims[node.NodeType] =
                userData.DeltaClaims[node.NodeType] -
                1;
        }
    }

    /// @notice mint a new node
    function MintNode(uint8 _type) external SaleLock mintTimeLimit(_type) {
        if (MaxNodes != 0) {
            require(_tokenIdCounter.current() < MaxNodes, "Sold Out");
        }
        NodeTypeMetadata storage nodeType = GetNodeTypeMetadata[_type];
        require(
            DefoToken.balanceOf(msg.sender) > nodeType.DefoPrice,
            "Insufficient Defo"
        );
        require(
            PaymentToken.balanceOf(msg.sender) > nodeType.StablePrice,
            "Insufficient USD"
        );
        DefoToken.transferFrom(msg.sender, address(this), nodeType.DefoPrice);
        PaymentToken.transferFrom(
            msg.sender,
            address(this),
            nodeType.StablePrice
        );
        _distributePayment(nodeType.DefoPrice, true);
        _distributePayment(nodeType.StablePrice, false);
        _mintNode(_type, msg.sender);
        if (block.timestamp - nodeType.LastMint >= 1 hours * MintLimitHours) {
            nodeType.LastMint = uint32(block.timestamp);
            nodeType.MintCount = 0;
        } else {
            nodeType.MintCount = nodeType.MintCount + 1;
        }
    }

    function ClaimRewards(uint256 _tokenid)
        external
        onlyNodeOwner(_tokenid)
        onlyActive(_tokenid)
    {
        Node memory node = NodeOf[_tokenid];
        uint256 rewardPoints = block.timestamp - node.LastReward;
        require(rewardPoints > RewardTime, "Too soon");
        _sendRewardTokens(_tokenid, 0);
    }

    function ClaimRewardsAll() external {
        require(balanceOf(msg.sender) > 0, "User doesn't have any nodes");
        address account = msg.sender;
        uint256[] memory nodesOwned = getNodeIdsOf(account);
        for (uint256 index = 0; index < nodesOwned.length; index++) {
            uint256 _tokenid = nodesOwned[index];
            Node memory node = NodeOf[_tokenid];
            uint256 rewardPoints = block.timestamp - node.LastReward;
            require(rewardPoints > RewardTime, "Too soon");
            require(isActive(_tokenid), "Node is deactivated");
            _sendRewardTokens(_tokenid, 0);
        }
    }

    function Maintenance(uint256 _tokenid, uint256 _days)
        external
        onlyNodeOwner(_tokenid)
    {
        _maintenance(_tokenid, _days);
    }

    function MaintenanceAll(uint256 _days) external {
        require(balanceOf(msg.sender) > 0, "User doesn't have any nodes");
        address account = msg.sender;
        uint256[] memory nodesOwned = getNodeIdsOf(account);
        for (uint256 index = 0; index < nodesOwned.length; index++) {
            uint256 _tokenid = nodesOwned[index];
            _maintenance(_tokenid, _days);
        }
    }

    /// @notice creates a new node with the given type from unclaimed rewards
    function Compound(uint256 _tokenid, uint8 _nodeType)
        external
        onlyNodeOwner(_tokenid)
        onlyActive(_tokenid)
    {
        NodeTypeMetadata memory nodeType = GetNodeTypeMetadata[_nodeType];
        require(
            PaymentToken.balanceOf(msg.sender) > nodeType.StablePrice,
            "Insufficient USD"
        );
        PaymentToken.transferFrom(
            msg.sender,
            address(this),
            nodeType.StablePrice
        );

        _distributePayment(nodeType.StablePrice, false);
        _compound(_tokenid, _nodeType);
    }

    /// @notice creates same type nodes from all the unclaimed rewards
    function CompoundAll() external returns (uint256[] memory) {
        require(balanceOf(msg.sender) > 0, "User doesn't have any nodes");

        address account = msg.sender;
        uint256[] memory nodesOwned = getNodeIdsOf(account);
        uint256[] memory compounded = new uint256[](nodesOwned.length);
        uint256 counter;
        for (uint256 index = 0; index < nodesOwned.length; index++) {
            Node memory node = NodeOf[nodesOwned[index]];
            NodeTypeMetadata memory nodeType = GetNodeTypeMetadata[
                node.NodeType
            ];
            if (
                (PaymentToken.balanceOf(msg.sender) >= nodeType.StablePrice) &&
                (checkRawReward(nodesOwned[index]) >= nodeType.DefoPrice)
            ) {
                PaymentToken.transferFrom(
                    msg.sender,
                    address(this),
                    nodeType.StablePrice
                );
                _distributePayment(nodeType.StablePrice, false);
                require(isActive(nodesOwned[index]), "Node is deactivated");
                _compound(nodesOwned[index], node.NodeType);
                compounded[counter] = nodesOwned[index];
                counter++;
            }
        }
        return compounded;
    }

    function AddModifier(uint256 _tokenid, NodeModif _modifier)
        external
        onlyNodeOwner(_tokenid)
        onlyActive(_tokenid)
    {
        Node storage node = NodeOf[_tokenid];
        require(node.Modifier == NodeModif.None, "Node already has a modifier");
        node.Modifier = _modifier;
    }

    // View Functions
    function isActive(uint256 _tokenid) public view returns (bool) {
        Node memory node = NodeOf[_tokenid];
        uint256 _lastTime = node.LastMaintained;
        uint256 _passedDays = (block.timestamp - _lastTime) / 60 / 60 / 24;

        return !(_passedDays > MaintenanceDays);
    }

    /// @dev get the token value from lp
    function getTokenValue() public view returns (uint256) {}

    function checkRawReward(uint256 _tokenid)
        public
        view
        returns (
            uint256 defoRewards /*, uint256 daiRewards*/
        )
    {
        Node memory node = NodeOf[_tokenid];
        NodeTypeMetadata memory nodeType = GetNodeTypeMetadata[node.NodeType];

        uint256 _rate = nodeType.RewardRate;
        if (node.Modifier == NodeModif.Fast) {
            _rate = _rate * 2;
        }
        if (node.Booster == Booster.Omega) {
            _rate = _rate * 2;
        } else if (node.Booster == Booster.Delta) {
            _rate = _rate + (((_rate * 20)) / 100);
        }

        uint256 _lastTime = node.LastReward;
        uint256 _passedDays = (block.timestamp - _lastTime) / 60 / 60 / 24;

        uint256 _rewardDefo = _passedDays *
            ((_rate * nodeType.DefoPrice) / 1000);
        uint256 taxRate = _rewardTax(_tokenid);
        if (taxRate != 0) {
            _rewardDefo = (_rewardDefo - ((taxRate * _rewardDefo) / 1000));
        }
        return (
            _rewardDefo /*, _rewardDai*/
        );
    }

    function checkTaperedReward(uint256 _tokenid)
        public
        view
        returns (uint256)
    {
        return _taperCalculate(_tokenid);
    }

    function checkPendingMaintenance(uint256 _tokenid)
        public
        view
        returns (uint256)
    {
        Node memory node = NodeOf[_tokenid];
        NodeTypeMetadata memory nodeType = GetNodeTypeMetadata[node.NodeType];
        uint256 _fee = nodeType.MaintenanceFee;
        uint256 _lastTime = node.LastMaintained;
        uint256 _passedDays;
        if (_lastTime > block.timestamp) {
            return 0;
        } else {
            _passedDays = (block.timestamp - _lastTime) / 60 / 60 / 24;
            uint256 _amount = _passedDays * _fee;
            return _amount;
        }
    }

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
    // TODO: set input to  NodeTypeMetadata struct
    /// @notice function for creating a new node type or changing a node type settings settings should sent as an array with a spesific order
    /// @dev required order is : [DefoPrice , StablePrice , MaintenanceFee , RewardRate , DailyLimit ]
    function setNodeSettings(uint8 _type, uint256[] calldata _settingsArray)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        require(
            _settingsArray.length >= 5,
            "Settings array length must be greater than 5"
        );
        NodeTypeMetadata storage nodeType = GetNodeTypeMetadata[_type];
        nodeType.DefoPrice = _settingsArray[0];
        nodeType.StablePrice = _settingsArray[1];
        nodeType.MaintenanceFee = uint16(_settingsArray[2]);
        nodeType.RewardRate = uint16(_settingsArray[3]);
        nodeType.DailyLimit = uint8(_settingsArray[4]);
    }

    /// @notice function for setting distribution addresses
    /// @dev required order is : [RewardPool , LimiterAddr , Donation , Team , Marketing ,  Buyback]
    function setAddresses(address[] calldata _addressArray)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        require(
            _addressArray.length >= 6,
            "Settings array length must be greater than 5"
        );

        RewardPool = _addressArray[0];
        LimiterAddr = _addressArray[1];
        Donation = _addressArray[2];
        Team = _addressArray[3];
        Marketing = _addressArray[4];
        Buyback = _addressArray[5];
    }

    function setMinReward(uint256 _minReward)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        minReward = _minReward;
    }

    function setMintLimitHours(uint8 _MintLimitHours)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        MintLimitHours = _MintLimitHours;
    }

    function ChangePaymentToken(address _newToken)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        PaymentToken = IERC20(_newToken);
    }

    function setDistirbution(address _targetAddress, uint256 _ratio)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        DistTable[_targetAddress] = _ratio;
    }

    function setRewardTax(uint256[] memory _rewardTaxTable)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        RewardTaxTable = _rewardTaxTable;
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
        override(
            ERC721Upgradeable,
            AccessControlUpgradeable,
            ERC721EnumerableUpgradeable
        )
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
        ILimiter limiter = ILimiter(LimiterAddr);
        require(
            limiter.transferLog(to, from, tokenId),
            "Transfer is forbidden"
        );
        super._transfer(from, to, tokenId);
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId
    ) internal override(ERC721Upgradeable, ERC721EnumerableUpgradeable) {
        super._beforeTokenTransfer(from, to, tokenId);
    }
}
