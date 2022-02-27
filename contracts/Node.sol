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

    uint256 public DefoPrice;
    uint256 public StablePrice;

    enum NodeType {
        Ruby,
        Sapphire,
        Diamond
    }
    enum NodeModif {
        Fast,
        Generous
    }
    mapping(uint256 => NodeType) public TypeOf;
    mapping(uint256 => NodeModif) public ModifierOf;

    /// @dev if it's 0 users can create unlimited nodes
    uint256 MaxNodes = 0;

    bool Lock;
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

    function RedeemMint(address to) public onlyRole(MINTER_ROLE) {
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        _safeMint(to, tokenId);
    }

    function MintNode(NodeType _type) external SaleLock {}

    function ClaimRewards() external {}

    function Maintenance() external {}

    /// Owner Functions

    function AddModifier(uint256 _tokenid, NodeModif _modifier) external {}

    function SetTax() external onlyRole(DEFAULT_ADMIN_ROLE) {}

    function ChangePaymentToken() external onlyRole(DEFAULT_ADMIN_ROLE) {}

    function EmergencyMode() external onlyRole(DEFAULT_ADMIN_ROLE) {}

    function ToggleLock() external onlyRole(DEFAULT_ADMIN_ROLE) {
        Lock = !Lock;
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
}
