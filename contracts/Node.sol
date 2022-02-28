pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "./interfaces/IERC20.sol";

contract MyToken is ERC721, AccessControl {
    using Counters for Counters.Counter;

    Counters.Counter private _tokenIdCounter;
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    IERC20 PaymentToken;
    IERC20 DefoToken;
    mapping(NodeType => uint256) public DefoPrice;
    mapping(NodeType => uint256) public StablePrice;

    /// @dev timestamp of last claimed reward
    mapping(uint256 => uint256) public LastReward;
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
    mapping(uint256 => NodeType) public TypeOf;
    mapping(uint256 => NodeModif) public ModifierOf;

    /// @dev token per second
    mapping(NodeType => uint256) public RewardRate;

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
        address _paymentToken
    ) ERC721("Defo Node", "Defo Node") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, _redeemContract);
        DefoToken = IERC20(_defoToken);
        PaymentToken = IERC20(_paymentToken);
    }

    // internal functions

    /// @dev sends the node payment to other wallets
    function _distributePayment(NodeType _type) internal {}

    function _rewardTax(uint256 _tokenid) internal {}

    function _sendRewardTokens(uint256 _tokenid) internal {}

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
        uint256 rewardPoints = block.timestamp - LastReward[_tokenid];
        require(rewardPoints > RewardTime, "Too soon");
        _rewardTax(_tokenid);
        _sendRewardTokens(_tokenid);
    }

    function Maintenance() external {}

    function Compound() external {
        require(balanceOf(msg.sender) > 0, "User doesn't have any nodes");
    }

    function AddModifier(uint256 _tokenid, NodeModif _modifier) external {
        require(
            ModifierOf[_tokenid] == NodeModif.None,
            "Node already has a modifier"
        );
        ModifierOf[_tokenid] = _modifier;
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
        override(ERC721, AccessControl)
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
}
