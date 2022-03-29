//SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "./interfaces/IERC20.sol";
import "./interfaces/LPManager.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";


//Make the conctract upgradeable

contract Limiter is AccessControlUpgradeable, OwnableUpgradeable {
    error UnauthorizedDestination(address unauthorized); //common error

    address private defoNode;
    address private DAIPool;
    LPManager DefoLPManager;
    IERC20 DefoToken;

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
    uint256 maxPercentageVsTotalSupply = 50; //Max percentage of total supply a wallet can hold

    

    constructor(
        uint256 _timeLimit, 
        address _taxCollector, 
        address _defoNodeAddress, 
        address _DAIPool, 
        address _lpManager,
        address _defoToken
    ) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        defoNode = _defoNodeAddress;
        TimeLimit = _timeLimit;
        TaxCollector = _taxCollector;
        DAIPool = _DAIPool;
        DefoLPManager = LPManager(_lpManager);
        DefoToken = IERC20 (_defoToken);
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


    /// @notice This function is called before any token transfer
    /// @param _sender the originator of the transfer
    /// @param _from where the transfer is coming from
    /// @param _to is the destination of the transfer
    /// @param _amount is the amount being sent
    function transferLog (
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
            bool LPAddOrSell = false;

            /// Check for excluded & common unauthorized addresses 
            if (_from == _to) {
                return true;
            }
            if ((_from == address(0)) || (_to == address(0))) {
                return true;
            }
            if (_to == DAIPool) {
                revert UnauthorizedDestination(
                    _to
                );
            }
            if (_to == defoNode) {
                revert UnauthorizedDestination( 
                    _to
                );
            }
            if (_to == address(this)){
                revert UnauthorizedDestination(
                    _to
                );
            }

//////////////////////////////////////////////////////////////////////////////////////////////            

            ///Determine type of transfer and update variables
            if (isPair(_from, _to)){
                if(!Whitelist[_to]) {
                    tokensBought[_to] += _amount;
                    tokensIn[timeframeWindow];
                }
                emit UserLimiterBuy(_sender, _from, _to);
            } else if (DefoLPManager.isRouter(_sender) && isPair(_to, _to)) {
                LPAddOrSell = true;
                if (1) {

                } else {

                }
                emit UserLimiterSellOrLiquidityAdd(
                    _sender,
                    _from,
                    _to
                );
            } else {
                if (!isExcludedfromObs(_to)) {
                    tokensIn[timeframeWindow][_to] += _amount;
                }
                if (!isExcludedfromObs(_from)) {
                    tokensOut[timeframeWindow][_from] += _amount;
                }
                emit UserLimiterTransfer(
                    _sender,
                    _from,
                    _to
                );
            }

//////////////////////////////////////////////////////////////////////////////////////////////

            ///Execute Checks
            if (!Whitelist[_to]) {
                require(
                    getMaxPercentage() >= (DefoToken.balanceOf(_to) + _amount),
                    "Cannot transfer to this wallet, must not exceed `getMaxPercentage()`"
                );
                // require (

                // );
            }

            if(LPAddOrSell) {
                
            } else {

            }
    }

    function getBoughtTokens(address _account) public view returns(uint256) {
        return tokensBought[_account];
    }

    function getMaxPercentage() public view returns(uint256) {
        return (DefoToken.totalSupply() * maxPercentageVsTotalSupply) / 10000;
    }

    function getTimeframeWindow() public view returns(uint256) {
        return timeframeWindow;
    }

    function getTimeframeExpiration() public view returns(uint256) {
        return timeframeExpiration;
    }

    function getTokensIn(address _account) public view returns(uint256) {
        return userQuotaTimeframeIn - tokensIn[timeframeWindow][_account];
    }

    function getTokensOut(address _account) public view returns(uint256) {
        return userQuotaTimeframeOut - tokensOut[timeframeWindow][_account];
    }

    function isWalletCompliant(address _wallet) public view returns(bool) {
        return DefoToken.balanceOf(_wallet) >= getMaxPercentage();
    }
 
    // function getTransfersLeft(address _account ) external returns(uint256) {
    //     return
    // }

    function isExcludedfromObs(address _account) public view returns(bool) {
        return Whitelist[_account] || 
        DefoLPManager.isRouter(_account) ||
        DefoLPManager.isPair(_account) ||
        DefoLPManager.isFeeReceiver(_account);
    }

    /// @notice Use basis points for input
    ///   i.e. if you want 2% input 200,
    ///   if you want 20% input 2000
    function setTaxRate (uint256 newTaxRate) external onlyRole(DEFAULT_ADMIN_ROLE) {
        TaxRate = newTaxRate;
    }

    function setMaxPercentage(uint256 _newPercentage) external onlyRole(DEFAULT_ADMIN_ROLE) {
        maxPercentageVsTotalSupply = _newPercentage;
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
