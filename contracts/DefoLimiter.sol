//SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "./interfaces/ILpManager.sol";
import "./interfaces/IGemHybrid.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract DefoLimiter is AccessControlUpgradeable, OwnableUpgradeable{
    
    error UnauthorizedDestination(address unauthorized); //common error

    address private defoNode;
    address private LPool;
    address diamondAddress;
    ILpManager DefoLPManager;
    IGemHybrid GemHybrid = IGemHybrid(diamondAddress);
    IERC20 DefoToken;


    mapping(address => bool) public Whitelist; //Addresses that are excluded from observation
    mapping(address => bool) public Blocklist; //Denied Addresses
    mapping(uint256 => mapping(address => uint256)) public tokensSold; //Tokens bought
    mapping (address => bool) public unauthorizedAddresses;

    // The block number `timeframeExpiration` is added to
    uint256 internal currentTimeframeWindow;
    
    // Amount of time that must pass between each sell
    uint256 public timeframeExpiration = 1 days; 

    // Max percentage of total supply a wallet can sell
    uint256 public sellLimitVsTotalSupply = 10; 
    
    uint256 constant DECIMAL_MULTIPLIER = 10 ** 18;
    address public taxCollector;

    function initialize( 
        address _taxCollector, 
        address _defoNodeAddress,
        address _diamondAddress
    ) public initializer {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        defoNode = _defoNodeAddress;
        taxCollector = _taxCollector;
        diamondAddress = _diamondAddress;
    }

    //have to get this from upgradeable
    modifier onlyDefoToken() {
        require (
            address(msg.sender) == address(DefoToken),
            "Only Defo ERC-20 contract can call this function");
        _;
    }

    modifier checkTimeframe() {
        uint256 currentTime = block.timestamp;
        if (currentTime > currentTimeframeWindow + timeframeExpiration) {
            currentTimeframeWindow = currentTime;
        }
        _;
    }

    modifier notDenied(
        address from,
        address to
    ) {
                require(
                    !Blocklist[from] &&
                    !Blocklist[to],
                    "Address is not permitted"
                );
        _;
    }

    event UserLimiterBuy (
        address indexed _from,
        address indexed _to
    );

    event UserLimiterSell (
        address indexed _from,
        address indexed _to
    );
    function isPair(address _checkAddress)
        private
        view
        returns(bool) {
            if (_checkAddress == LPool) {
                return true;
            }
    }

    /// @notice This function is called before any token transfer
    /// @param from where the transfer is coming from
    /// @param to is the destination of the transfer
    /// @param amount is the amount being sent
    function transferLog (
        address from,
        address to,
        uint256 amount
    )
        external
        onlyDefoToken
        checkTimeframe
        notDenied(from, to)
        returns(bool) {
            //Check for excluded & common unauthorized addresses 
            if (unauthorizedAddresses[to] == true) {
                revert UnauthorizedDestination(to);
            }

            if (isPair(to)) {
                uint256[] memory gemIds = GemHybrid.getGemIdsOf(from);
                uint256 sellAmount;
                require(gemIds.length > 0);
                for (uint256 i = 0; i < gemIds.length; i++) {
                    uint8 gemType = GemHybrid.GemOf(gemIds[i]).GemType;
                    sellAmount += GemHybrid.GetGemTypeMetadata(gemType).RewardRate;
                }

                require(amount <= sellAmount, "Cannot sell more than amount of total rewards per week");
                require(
                    tokensSold[currentTimeframeWindow][from] <= 
                    ((DefoToken.totalSupply() * sellLimitVsTotalSupply) / 10000), 
                    "Cannot sell more then 0.1% of DEFO total supply per 24h"
                );
    
                DefoToken.transferFrom(from, taxCollector, amount);

                emit UserLimiterSell(
                    from,
                    to
                );
            }
            return true;
    }
    function isExcludedFromObs(address _account) public view returns(bool) {
        return Whitelist[_account] || 
        DefoLPManager.isRouter(_account) ||
        DefoLPManager.isPair(_account);
    }

    function setMaxPercentage(uint256 _newPercentage) external onlyRole(DEFAULT_ADMIN_ROLE) {
        sellLimitVsTotalSupply = _newPercentage;
    }

    function setTaxCollector (address newTaxCollector) external onlyRole(DEFAULT_ADMIN_ROLE) {
        taxCollector = newTaxCollector;
    }

    function setTokenAddress (address newTokenAddress) external onlyRole(DEFAULT_ADMIN_ROLE) {
        DefoToken = IERC20(newTokenAddress);
    }

    function setLPAddress(address newLpAddress) external onlyRole(DEFAULT_ADMIN_ROLE) {
        LPool = newLpAddress;
    }
    function setLPManager(address newLpManager) external onlyRole(DEFAULT_ADMIN_ROLE) {
        DefoLPManager = ILpManager(newLpManager);
    }

    function setDiamond(address _newDiamond) public onlyRole(DEFAULT_ADMIN_ROLE) {
       GemHybrid = IGemHybrid(_newDiamond);
    }

    function setTimeframeExpiration(uint256 newTimeframeExpiration) external onlyRole(DEFAULT_ADMIN_ROLE) {
        timeframeExpiration = newTimeframeExpiration;
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
