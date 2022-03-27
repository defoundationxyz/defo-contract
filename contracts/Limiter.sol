//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./interfaces/IERC20.sol";
import "./interfaces/LPManager.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";


//Make the conctract upgradeable

contract Limiter is AccessControlUpgradeable, OwnableUpgradeable {
    address private defoNode;
    address private DAIPool;
    LPManager DefoLPManager;

    // minimum allowed time between transfers
    uint256 TimeLimit;
    // tax rate tax only applies to non-whitelisted addresses
    uint256 TaxRate = 5000; //basis points

    address public TaxCollector;
    //limiter must be pre-approved by taxed token
    address public TaxedToken;

    mapping(address => bool) Whitelist; //Addresses that are excluded from observation
    mapping(address => bool) Blocklist; //Denied Addresses
    mapping(address => uint256) public TransferLog;
    mapping(address => uint256) public tokensBought;
    mapping(uint256 => mapping(address => uint256)) public tokensIn;
    mapping(uint256 => mapping(address => uint256)) public tokensOut;

    uint256 userQuotaTimeframeIn;
    uint256 userQuotaTimeframeOut;
    uint256 timeframeWindow;
    uint256 timeframeExpiration;

    

    constructor(uint256 _timeLimit, address _taxCollector, address _defoNodeAddress, address _DAIPool, address _lpManager) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        defoNode = _defoNodeAddress;
        TimeLimit = _timeLimit;
        TaxCollector = _taxCollector;
        DAIPool = _DAIPool;
        DefoLPManager = LPManager(_lpManager);
    }

    modifier onlyNode() {
        require (
            address(msg.sender) == defoNode,
            "Only Defo node contract can call this function");
        _;
    }

    modifier checkTimeframe() {
        uint256 currentTime = block.timestamp;
        if (currentTime > timeframeWindow + timeframeExpiration) {
            timeframeWindow = currentTime;
        }
        _;
    }

    modifier notDenied(
        address sender,
        address from,
        address to,
        address origin
    ) {
        if (
            origin != owner() &&
            to != owner()) {
                require(
                    !Blocklist[sender] &&
                    !Blocklist[from] &&
                    !Blocklist[to] &&
                    !Blocklist[origin],
                    "Address is not permitted"
                );
        }
        _;
    }

    event UserLimiterBuy (
        address indexed _sender,
        address indexed _from,
        address indexed _to
    );

    event UserLimiterSellOrLiquidityAdd (
        address indexed _sender,
        address indexed _from,
        address indexed _to
    );

    event UserLimiterLiquidityWithdrawal (bool indexed _status);

    event UserLimiterTransfer (
        address indexed _sender,
        address indexed _from,
        address indexed _to
    );

    function isPair(address _from, address _to)
        private
        view
        returns(bool) {
            if ((_from == DAIPool) && (_to == DAIPool)) {
                return true;
            }
    }

    function beforeTokenTrasfer(
        address _sender,
        address _from,
        address _to,
        uint256 _amount
    )
        external
        onlyNode
        checkTimeframe
        notDenied(_sender, _from, _to, tx.origin)
        returns(bool) {
            if (_from == _to) {
                return true;
            }
            if ((_from == address(0)) || (_to == address(0))) {
                return true;
            }

            require (
                _to != DAIPool,
                "Cannot directly send to the liquidity pool"
            );
            require (
                _to != defoNode,
                "Cannot send directly to the node contract"
            );
            require (
                _to != address(this),
                "Cannot send directly to this contract"
            );

            if (isPair(_from, _to)){
                if(!Whitelist[_to]) {
                    tokensBought[_to] += _amount;
                    tokensIn[timeframeWindow];
                }
                emit UserLimiterBuy(_sender, _from, _to);
            } else if (DefoLPManager.isRouter(_sender) && isPair(_from, _to)) {

            }
    }

    /// @notice Use basis points for input
    ///   i.e. if you want 2% input 200,
    ///   if you want 20% input 2000
    function setTaxRate (uint256 newTaxRate) external onlyRole(DEFAULT_ADMIN_ROLE) {
        TaxRate = newTaxRate;
    }

    function setTaxCollector (address newTaxCollector) external onlyRole(DEFAULT_ADMIN_ROLE) {
        TaxCollector = newTaxCollector;
    }

    function setToken(address _token) external onlyRole(DEFAULT_ADMIN_ROLE) {
        TaxedToken = _token;
    }

    function editWhitelist(address _address, bool _allow)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        Whitelist[_address] = _allow;
    }

    function editBlocklist(address _address, bool _allow)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        Blocklist[_address] = _allow;
    }

    function transferLog(
        address to,
        address from,
        uint256 amount
    ) external returns (bool) {
        if (Whitelist[to] || Whitelist[from]) {
            return true;
        }

        if (Blocklist[to] || Blocklist[from]) {
            return true;
        }

        if (TaxedToken != address(0)) {
            uint256 taxedamount = (amount * TaxRate) / 10000;
            IERC20 token = IERC20(TaxedToken);
            token.transferFrom(from, TaxCollector, taxedamount);
        }

        if (block.number - TransferLog[from] > TimeLimit) {
            TransferLog[from] = block.number;
            return true;
        } else {
            return false;
        }
    }
}
