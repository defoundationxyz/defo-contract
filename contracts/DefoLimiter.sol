//SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

//import "./interfaces/IERC20.sol";
import "./interfaces/LpManager.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";


//Make the conctract upgradeable

contract Limiter is AccessControlUpgradeable, OwnableUpgradeable {
    error UnauthorizedDestination(address unauthorized); //common error

    address private defoNode;
    address private DAIPool;
    LpManager DefoLPManager;
    IERC20 DefoToken;

    mapping(address => bool) public Whitelist; //Addresses that are excluded from observation
    mapping(address => bool) public Blocklist; //Denied Addresses
    mapping(uint256 => mapping(address => uint256)) public tokensBought; //Tokens bought
    //mapping(uint256 => mapping(address => uint256)) public tokensSold; //Tokens sold

    uint256 internal currentTimeframeWindow; //The block number `timeframExpiration` is added to
    uint256 internal timeframeExpiration; //Amount of time that must pass between each buy
    uint256 public maxPercentageVsTotalSupply = 50; //Max percentage of total supply a wallet can hold
    uint256 public taxRate = 5000; //basis points
    address public taxCollector;
    uint256 constant DECIMAL_MULTIPLIER = 10 ** 18;

    constructor(
        uint256 _timeExpiration, 
        address _taxCollector, 
        address _defoNodeAddress, 
        address _DAIPool, 
        address _lpManager,
        address _defoToken
    ) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        defoNode = _defoNodeAddress;
        timeframeExpiration = _timeExpiration;
        taxCollector = _taxCollector;
        DAIPool = _DAIPool;
        DefoLPManager = LpManager(_lpManager);
        DefoToken = IERC20 (_defoToken);
    }

    //have to get this from upgradeable
    modifier onlyNode() {
        require (
            address(msg.sender) == defoNode,
            "Only Defo node contract can call this function");
        _;
    }

    modifier checkTimeframe() {
        uint256 currentTime = block.number;
        if (currentTime > currentTimeframeWindow + timeframeExpiration) {
            currentTimeframeWindow = currentTime;
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
            uint256 tokensBoughtBalanceAfterSellOrAdd = 0;

            //Check for excluded & common unauthorized addresses 
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

            //Determine type of activity
            if (isPair(_from, _to)){
                if(!Whitelist[_to]) {
                    tokensBought[currentTimeframeWindow][_to] += _amount;
                    
                    if(!isExcludedFromObs(_to)){
                        require (
                            tokensBought[currentTimeframeWindow][_to] + _amount <= getMaxPercentage(),
                            "Cannot buy anymore tokens during this timeframe"
                        );
                    }
                }
                emit UserLimiterBuy(_sender, _from, _to);
            } else if (DefoLPManager.isRouter(_sender) && isPair(_to, _to)) {
                /*uint256 taxedAmount = (_amount * taxRate) / 10000;
                if (tokensBoughtBalanceAfterSellOrAdd >= 0) {
                    tokensBought[currentTimeframeWindow][_from] -= tokensBoughtBalanceAfterSellOrAdd;
                } else {
                    tokensSold[currentTimeframeWindow][_from] -= tokensBoughtBalanceAfterSellOrAdd;
                }*/

                DefoToken.transferFrom(_from, taxCollector, taxedAmount * DECIMAL_MULTIPLIER);

                emit UserLimiterSellOrLiquidityAdd(
                    _sender,
                    _from,
                    _to
                );
            }

            return true;
    }

    function getMaxPercentage() public view returns(uint256) {
        return (DefoToken.totalSupply() * maxPercentageVsTotalSupply) / 10000;
    }
    function isExcludedfromObs(address _account) public view returns(bool) {
        return Whitelist[_account] || 
        DefoLPManager.isRouter(_account) ||
        DefoLPManager.isPair(_account);
    }

    /// @notice Use basis points for input
    ///   i.e. if you want 2% input 200,
    ///   if you want 20% input 2000
    function setTaxRate (uint256 newTaxRate) external onlyRole(DEFAULT_ADMIN_ROLE) {
        taxRate = newTaxRate;
    }

    function setMaxPercentage(uint256 _newPercentage) external onlyRole(DEFAULT_ADMIN_ROLE) {
        maxPercentageVsTotalSupply = _newPercentage;
    }

    function setTaxCollector (address newTaxCollector) external onlyRole(DEFAULT_ADMIN_ROLE) {
        taxCollector = newTaxCollector;
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
}
