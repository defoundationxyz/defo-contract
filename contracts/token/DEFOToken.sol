//SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.15;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "../interfaces/ITransferLimiter.sol";

/** @title  DEFO Token
  * @author Decentralized Foundation Team
  * @notice ERC20 with Dai-like gas-less approvals with EIP712 signatures, admin access, black lists, burnable, pausable, and recoverable if tokens are mistakely sent
*/

contract DEFOToken is Pausable, IERC20, IERC20Metadata {
    ITransferLimiter transferLimiter;

    mapping(address => uint256) private _balances;

    // @notice Admins list
    mapping(address => uint256) public wards;

    // @notice Blacklist
    mapping(address => bool) public blacklist;

    // --- ERC20 Data ---
    string public constant name = "DEFO Token";
    string public constant symbol = "DEFO";
    string public constant version = "1";
    uint8 public constant decimals = 18;
    uint256 public totalSupply;
    bool public initialized;

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;
    mapping(address => uint256) public nonces;


    // --- EIP712 niceties ---
    bytes32 public DOMAIN_SEPARATOR;
    // bytes32 public constant PERMIT_TYPEHASH = keccak256("Permit(address holder,address spender,uint256 nonce,uint256 expiry,bool allowed)");
    bytes32 public constant PERMIT_TYPEHASH = 0xea2aa0a1be11a07ed86d755c93467f4f82362b452371d1ba94d1715123511acb;

    /* ============ External and Public Functions ============ */

    modifier auth() {
        require(wards[_msgSender()] == 1, "DEFOToken:not-authorized");
        _;
    }

    constructor(uint256 chainId_) {
    }

    function initialize(uint256 chainId_) external {
        if (!initialized) {
            initialized = true;
            wards[_msgSender()] = 1;
            DOMAIN_SEPARATOR = keccak256(
                abi.encode(
                    keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
                    keccak256(bytes(name)),
                    keccak256(bytes(version)),
                    chainId_,
                    address(this)
                )
            );
        }
    }


    // --- Token ---

    function transfer(address dst, uint256 wad) external returns (bool) {
        return transferFrom(_msgSender(), dst, wad);
    }

    function transferFrom(
        address src,
        address dst,
        uint256 wad
    ) public returns (bool) {
        require(!paused(), "DEFOToken:paused");
        require(balanceOf[src] >= wad, "DEFOToken:insufficient-balance");
        require(!blacklist[src] && !blacklist[dst], "DEFOToken:blacklisted");
        if (wards[_msgSender()] != 1 && wards[src] != 1 && address(transferLimiter) != address(0))
            transferLimiter.DEFOTokenTransferLimit(src, dst, wad);
        if (src != _msgSender() && allowance[src][_msgSender()] != type(uint256).max) {
            require(allowance[src][_msgSender()] >= wad, "DEFOToken:insufficient-allowance");
            allowance[src][_msgSender()] = sub(allowance[src][_msgSender()], wad);
        }
        balanceOf[src] = sub(balanceOf[src], wad);
        balanceOf[dst] = add(balanceOf[dst], wad);
        emit Transfer(src, dst, wad);
        return true;
    }


    function burn(address usr, uint256 wad) external {
        require(balanceOf[usr] >= wad, "DEFOToken:insufficient-balance");
        if (usr != _msgSender() && allowance[usr][_msgSender()] != type(uint256).max) {
            require(allowance[usr][_msgSender()] >= wad, "DEFOToken:insufficient-allowance");
            allowance[usr][_msgSender()] = sub(allowance[usr][_msgSender()], wad);
        }
        balanceOf[usr] = sub(balanceOf[usr], wad);
        totalSupply = sub(totalSupply, wad);
        emit Transfer(usr, address(0), wad);
    }

    function approve(address usr, uint256 wad) external returns (bool) {
        allowance[_msgSender()][usr] = wad;
        emit Approval(_msgSender(), usr, wad);
        return true;
    }

    // --- Approve by signature ---
    function permit(
        address holder,
        address spender,
        uint256 nonce,
        uint256 expiry,
        bool allowed,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external {
        bytes32 digest = keccak256(
            abi.encodePacked(
                "\x19\x01",
                DOMAIN_SEPARATOR,
                keccak256(abi.encode(PERMIT_TYPEHASH, holder, spender, nonce, expiry, allowed))
            )
        );

        require(holder != address(0), "DEFOToken:invalid-address-0");
        require(holder == ecrecover(digest, v, r, s), "DEFOToken:invalid-permit");
        require(expiry == 0 || block.timestamp <= expiry, "DEFOToken:permit-expired");
        require(nonce == nonces[holder]++, "DEFOToken:invalid-nonce");
        uint256 wad = allowed ? type(uint256).max : 0;
        allowance[holder][spender] = wad;
        emit Approval(holder, spender, wad);
    }

    /* ============ External and Public Admin Functions ============ */

    function linkDiamond(ITransferLimiter _transferLimiter) external auth {
        transferLimiter = _transferLimiter;
    }

    function mint(address usr, uint256 wad) external auth {
        balanceOf[usr] = add(balanceOf[usr], wad);
        totalSupply = add(totalSupply, wad);
        emit Transfer(address(0), usr, wad);
    }

    // @notice Grant access
    // @param guy admin to grant auth
    function rely(address guy) external auth {
        wards[guy] = 1;
    }

    // @notice Deny access
    // @param guy deny auth for
    function deny(address guy) external auth {
        wards[guy] = 0;
    }


    // Recovering lost tokens and avax
    function recoverLostDEFO(
        address _token,
        address _to,
        uint256 _amount
    ) external auth {
        IERC20(_token).transfer(_to, _amount);
    }

    function recoverLostAVAX(address _to) external auth {
        payable(_to).transfer(address(this).balance);
    }

    function updateBlacklist(address _address, bool _allow) external auth {
        blacklist[_address] = _allow;
    }

    function pause() external auth {
        _pause();
    }

    function unpause() external auth {
        _unpause();
    }

    function getLinkedDiamond() external view returns (ITransferLimiter) {
        return transferLimiter;
    }

    function authorized(address guy) external view returns (bool) {
        return wards[guy] == 1;
    }
    /* ============ Internal Functions ============ */

    // --- Math ---
    function add(uint256 x, uint256 y) internal pure returns (uint256 z) {
        require((z = x + y) >= x);
    }

    function sub(uint256 x, uint256 y) internal pure returns (uint256 z) {
        require((z = x - y) <= x);
    }

}
