// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "hardhat/console.sol";
// TODO OPTIMIZATION : find a cheaper library
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
/// @dev we need enumerable for compundAll function
// TODO OPTIMIZATION : find a way to write compoundall system without enumerable
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "./interfaces/IERC20.sol";

interface ILimiter {
    function transferLog(
        address to,
        address from,
        uint256 tokenid
    ) external returns (bool);
}

contract DefoNode is ERC721, AccessControl, ERC721Enumerable, ERC721Burnable {
    // TODO : add events

    using Counters for Counters.Counter;

    uint256 public constant MaintenanceDays = 30;
    Counters.Counter private _tokenIdCounter;
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    IERC20 PaymentToken;
    IERC20 DefoToken;
    mapping(address => uint256) public DistTable;
    uint256[] public RewardTaxTable;
    mapping(NodeType => uint256) public DefoPrice;
    mapping(NodeType => uint256) public StablePrice;
    uint256 minReward = 0;
    /// @dev timestamp of last claimed reward
    mapping(uint256 => uint256) public LastReward;

    mapping(uint256 => uint256) public claimedReward;
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
    address RewardPool;
    address LimiterAddr;
    address Team;
    address Marketing;
    address Donation;
    address Buyback;

    mapping(uint256 => NodeType) public TypeOf;
    mapping(uint256 => NodeModif) public ModifierOf;
    address[] GenerousityList;
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
        address _treasury,
        address _limiter,
        address _rewardPool
    ) ERC721("Defo Node", "Defo Node") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, _redeemContract);
        DefoToken = IERC20(_defoToken);
        PaymentToken = IERC20(_paymentToken);
        Treasury = _treasury;
        LimiterAddr = _limiter;
        RewardPool = _rewardPool;
    }

    // internal functions

    /// @dev WIP
    function _taperCalculate(uint256 _tokenId) internal view returns (uint256) {
        uint256 rewardCount = checkReward(_tokenId) + claimedReward[_tokenId];
        uint256 remainingReward;
        uint256 actualReward;
        uint256 x = 0;
        NodeType tokenType = TypeOf[_tokenId];
        uint256 typePrice = DefoPrice[tokenType];
        uint256 firstMilestone = typePrice + (typePrice / 2);
        if (rewardCount > firstMilestone) {
            remainingReward = rewardCount - firstMilestone;
            actualReward = firstMilestone;
            while (remainingReward > typePrice) {
                /*console.log("bing %d", x);
                console.log("reward %d", remainingReward);
                console.log("gas %d", gasleft());*/
                x++;
                remainingReward = remainingReward - typePrice;
                actualReward = actualReward + (((remainingReward) * 70) / 100);
                actualReward = actualReward + typePrice;
            }
            return actualReward - claimedReward[_tokenId];
        }
        return checkReward(_tokenId);
    }

    function _executeModifier() internal {}

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
        uint256 diff = block.timestamp - LastReward[_tokenid];
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

    function _mintNode(NodeType _type, address _to) internal returns (uint256) {
        if (MaxNodes != 0) {
            require(_tokenIdCounter.current() < MaxNodes, "Sold Out");
        }
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        _safeMint(_to, tokenId);
        TypeOf[tokenId] = _type;
        LastReward[tokenId] = block.timestamp;
        return tokenId;
    }

    /// @dev main reward calculation and transfer function probably will changed in the future all rates are daily rates
    function _sendRewardTokens(uint256 _tokenid) internal {
        uint256 _rewardDefo = _taperCalculate(_tokenid);

        uint256 taxRate = _rewardTax(_tokenid);
        if (taxRate != 0) {
            _rewardDefo = (_rewardDefo - ((taxRate * _rewardDefo) / 1000));
            //_rewardDai = (_rewardDai - ((taxRate * _rewardDai) / 1000));
        }

        DefoToken.transferFrom(Treasury, msg.sender, _rewardDefo);
        claimedReward[_tokenid] = claimedReward[_tokenid] + _rewardDefo;
        //PaymentToken.transferFrom(Treasury, msg.sender, _rewardDai);
        LastReward[_tokenid] = block.timestamp;
    }

    /// almost same as the sendRewardTokens function but mainly for compounding pay
    function _sendRewardTokensWithOffset(uint256 _tokenid, uint256 _offset)
        internal
    {
        uint256 _rewardDefo = _taperCalculate(_tokenid);

        uint256 taxRate = _rewardTax(_tokenid);
        if (taxRate != 0) {
            _rewardDefo = (_rewardDefo - ((taxRate * _rewardDefo) / 1000));
            //_rewardDai = (_rewardDai - ((taxRate * _rewardDai) / 1000));
        }
        _rewardDefo = _rewardDefo - _offset;
        DefoToken.transferFrom(Treasury, msg.sender, _rewardDefo);
        claimedReward[_tokenid] = claimedReward[_tokenid] + _rewardDefo;
        //PaymentToken.transferFrom(Treasury, msg.sender, _rewardDai);
        LastReward[_tokenid] = block.timestamp;
    }

    // TODO add stablecoin payment
    // TODO add recursive compounding
    // node compounding function creates a node from unclaimed rewards , only creates same type of the compounded node
    function _compound(uint256 _tokenid) internal {
        NodeType nodeType = TypeOf[_tokenid];
        uint256 rewardDefo = _taperCalculate(_tokenid);
        require(rewardDefo >= (DefoPrice[nodeType] * 2), "not enough rewards");
        _sendRewardTokensWithOffset(_tokenid, (DefoPrice[nodeType] * 2));
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        _safeMint(msg.sender, tokenId);
        TypeOf[tokenId] = nodeType;
        LastMaintained[tokenId] = block.timestamp;
    }

    // a fusion like node upgrade burns smaller nodes to create a bigger node , tapers would reset
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
            /// @dev reward if any unclaimed rewards left
            _sendRewardTokens(_tokenids[index]);

            burn(_tokenids[index]);
        }
        require(
            DefoToken.transferFrom(
                msg.sender,
                address(this),
                UpgradeTax[firstToCheck]
            ),
            "Payment Failed"
        );

        if (firstToCheck == NodeType.Ruby) {
            uint256 tokenId = _mintNode(NodeType.Sapphire, msg.sender);
            LastMaintained[tokenId] = block.timestamp;
        } else {
            uint256 tokenId = _mintNode(NodeType.Diamond, msg.sender);
            LastMaintained[tokenId] = block.timestamp;
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
        require(_days <= 240, "must be less than 6 months");
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
        uint256 offset = 1 days * _days;
        LastMaintained[_tokenid] = block.timestamp + offset;
    }

    // Public Functions

    function RedeemMint(NodeType _type, address _to)
        public
        onlyRole(MINTER_ROLE)
    {
        _mintNode(_type, _to);
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
        DefoToken.transferFrom(msg.sender, address(this), DefoPrice[_type]);
        PaymentToken.transferFrom(
            msg.sender,
            address(this),
            StablePrice[_type]
        );
        _distributePayment(DefoPrice[_type], true);
        _distributePayment(StablePrice[_type], false);
        _mintNode(_type, msg.sender);
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
        NodeType _type = TypeOf[_tokenid];
        require(
            PaymentToken.balanceOf(msg.sender) > StablePrice[_type],
            "Insufficient USD"
        );
        PaymentToken.transferFrom(
            msg.sender,
            address(this),
            StablePrice[_type]
        );

        require(isActive(_tokenid), "Node is deactivated");
        _distributePayment(StablePrice[_type], false);
        _compound(_tokenid);
    }

    function CompoundAll() external {
        require(balanceOf(msg.sender) > 0, "User doesn't have any nodes");
        address account = msg.sender;
        uint256[] memory nodesOwned = getNodeIdsOf(account);
        for (uint256 index = 0; index < nodesOwned.length; index++) {
            require(isActive(nodesOwned[index]), "Node is deactivated");
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

    /// @dev get the token value from lp
    function getTokenValue() public view returns (uint256) {}

    function checkReward(uint256 _tokenid)
        public
        view
        returns (
            uint256 defoRewards /*, uint256 daiRewards*/
        )
    {
        NodeType _type = TypeOf[_tokenid];
        uint256 _rate = RewardRate[_type];
        uint256 _lastTime = LastReward[_tokenid];
        uint256 _passedDays = (block.timestamp - _lastTime) / 60 / 60 / 24;
        console.log("DAYS : %d ", _passedDays);

        uint256 _rewardDefo = _passedDays * ((_rate * DefoPrice[_type]) / 1000);
        console.log("reward : %d ", _rewardDefo);

        uint256 taxRate = _rewardTax(_tokenid);
        if (taxRate != 0) {
            _rewardDefo = (_rewardDefo - ((taxRate * _rewardDefo) / 1000));
        }
        return (
            _rewardDefo /*, _rewardDai*/
        );
    }

    function checkPendingMaintenance(uint256 _tokenid)
        public
        view
        returns (uint256)
    {
        NodeType _nodeType = TypeOf[_tokenid];
        uint256 _fee = MaintenanceFee[_nodeType];
        uint256 _lastTime = LastMaintained[_tokenid];
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
    function SetNodePrice(
        NodeType _type,
        uint256 _daiPrice,
        uint256 _defoPrice
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        DefoPrice[_type] = _defoPrice;
        StablePrice[_type] = _daiPrice;
    }

    function SetTax() external onlyRole(DEFAULT_ADMIN_ROLE) {}

    function setRewardRate(NodeType _type, uint256 _rate)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        RewardRate[_type] = _rate;
    }

    function setMaintenanceRate(NodeType _type, uint256 _rate)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        MaintenanceFee[_type] = _rate;
    }

    function setMinReward(uint256 _minReward)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        minReward = _minReward;
    }

    /// @dev could be optimized by using a map or enums right now like this for testing purposes
    function changeRewardAddress(address _newAddress)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        RewardPool = _newAddress;
    }

    function changeLimiterAddress(address _newAddress)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        LimiterAddr = _newAddress;
    }

    function changeDonationAddress(address _newAddress)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        Donation = _newAddress;
    }

    function changeTeamAddress(address _newAddress)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        Team = _newAddress;
    }

    function changeMarketingAddress(address _newAddress)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        Marketing = _newAddress;
    }

    function changeBuybackAddress(address _newAddress)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        Buyback = _newAddress;
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

    function setUpgradeRequirements(NodeType _type, uint256 _rate)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        UpgradeRequirements[_type] = _rate;
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
    ) internal override(ERC721, ERC721Enumerable) {
        super._beforeTokenTransfer(from, to, tokenId);
    }
}