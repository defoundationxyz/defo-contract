//SPDX-License-Identifier: MIT
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

    // @notice this is for the 1000 DEFO per 24h sale limitation, can be changes with setTransferLimit
    mapping(address => uint256) public tokensTransferred;
    mapping(address => uint256) public timeOfLastTransfer;
    uint256 public transferLimitPeriod = 1 days;
    uint256 public transferLimit = 1000;

    // --- ERC20 Data ---
    string public constant name = "DEFO Token";
    string public constant symbol = "DEFO";
    string public constant version = "1";
    uint8 public constant decimals = 18;
    uint256 public totalSupply;

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;
    mapping(address => uint256) public nonces;


    // --- EIP712 niceties ---
    bytes32 public DOMAIN_SEPARATOR;
    // bytes32 public constant PERMIT_TYPEHASH = keccak256("Permit(address holder,address spender,uint256 nonce,uint256 expiry,bool allowed)");
    bytes32 public constant PERMIT_TYPEHASH = 0xea2aa0a1be11a07ed86d755c93467f4f82362b452371d1ba94d1715123511acb;

    /* ============ External and Public Functions ============ */

    modifier auth() {
        require(wards[_msgSender()] == 1, "DEFO/not-authorized");
        _;
    }

    constructor(uint256 chainId_) {
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

    function initialize(uint256 chainId_) external {
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

    // --- Token ---

    function transfer(address dst, uint256 wad) external returns (bool) {
        return transferFrom(_msgSender(), dst, wad);
    }

    function transferFrom(
        address src,
        address dst,
        uint256 wad
    ) public returns (bool) {
        require(!paused(), "DEFO/token transfer while paused");
        require(balanceOf[src] >= wad, "DEFO/insufficient-balance");
        require(!blacklist[src] && !blacklist[dst], "DEFO/Address is not permitted");
        if (wards[_msgSender()] != 1) {
            uint256 endOfLimitWindow = timeOfLastTransfer[src] + transferLimitPeriod;
            require(
                (tokensTransferred[src] + wad <= transferLimit) || (block.timestamp > endOfLimitWindow),
                "DEFO/transfer limit"
            );
            if (block.timestamp > endOfLimitWindow)
                tokensTransferred[src] = wad;
            else
                tokensTransferred[src] += wad;
            timeOfLastTransfer[src] = block.timestamp;
            if (address(transferLimiter) != address(0))
                transferLimiter.DEFOTokenTransferLimit(src, dst, wad);
        }
        if (src != _msgSender() && allowance[src][_msgSender()] != type(uint256).max) {
            require(allowance[src][_msgSender()] >= wad, "DEFO/insufficient-allowance");
            allowance[src][_msgSender()] = sub(allowance[src][_msgSender()], wad);
        }
        balanceOf[src] = sub(balanceOf[src], wad);
        balanceOf[dst] = add(balanceOf[dst], wad);
        emit Transfer(src, dst, wad);
        return true;
    }


    function burn(address usr, uint256 wad) external {
        require(balanceOf[usr] >= wad, "DEFO/insufficient-balance");
        if (usr != _msgSender() && allowance[usr][_msgSender()] != type(uint256).max) {
            require(allowance[usr][_msgSender()] >= wad, "DEFO/insufficient-allowance");
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

        require(holder != address(0), "DEFO/invalid-address-0");
        require(holder == ecrecover(digest, v, r, s), "DEFO/invalid-permit");
        require(expiry == 0 || block.timestamp <= expiry, "DEFO/permit-expired");
        require(nonce == nonces[holder]++, "DEFO/invalid-nonce");
        uint256 wad = allowed ? type(uint256).max : 0;
        allowance[holder][spender] = wad;
        emit Approval(holder, spender, wad);
    }

    /* ============ External and Public Admin Functions ============ */

    function linkDiamond(ITransferLimiter _transferLimiter) external auth {
        transferLimiter = _transferLimiter;
    }

    function setTransferLimit(uint256 _transferLimit, uint256 _transferLimitPeriod) external auth {
        transferLimitPeriod = _transferLimitPeriod;
        transferLimit = _transferLimit;
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

    /* ============ Internal Functions ============ */

    // --- Math ---
    function add(uint256 x, uint256 y) internal pure returns (uint256 z) {
        require((z = x + y) >= x);
    }

    function sub(uint256 x, uint256 y) internal pure returns (uint256 z) {
        require((z = x - y) <= x);
    }

}
