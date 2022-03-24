//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./interfaces/IERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

//Make the conctract upgradeable

contract Limiter is AccessControl {
    address public owner;
    address defoNode;
    mapping(address => uint256) TransferLog;

    // minimum allowed time between transfers
    uint256 TimeLimit;
    // tax rate tax only applies to non-whitelisted addresses
    uint256 TaxRate = 5000; //basis points

    address public TaxCollector;
    //limiter must be pre-approved by taxed token
    address public TaxedToken;

    //don't tax addresses like limiter , lp and null address
    mapping(address => bool) Whitelist;

    mapping(address => bool) Blocklist;

    constructor(uint256 _timeLimit, address _taxCollector, address _defoNodeAddress) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        owner = msg.sender;
        defoNode = _defoNodeAddress;
        TimeLimit = _timeLimit;
        TaxCollector = _taxCollector;
    }

    modifier onlyNode() {
        require (
            address(msg.sender) == defoNode, 
            "Only Defo node contract can call this function"
        );
        _;
    }

    modifier checkTimeframe() {
        _;
    }

    //Can't get the `DEFAULT_ADMIN_ROLE` address from AccessControl so used owner variable
    // Add Ownable
    modifier notDenied(
        address sender,
        address from,
        address to,
        address origin

    ) {
        if (
            origin != owner &&
            to != owner) {
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

    event UserLimiterBought ();
    event UserLimiterSellOrLiquidityAdd ();
    event UserLimiterLiquidityWithdrawal ();
    event UserLimiterTransfer ();

    function beforeTokenTrasfer() external onlyNode checkTimeframe /*notDenied()*/ {}

    /// Use basis points for input
    ///   i.e. if you want 2% input 200, 
    ///   if you want 20% input 2000
    function setTaxRate (uint256 newTaxRate) external onlyRole(DEFAULT_ADMIN_ROLE) {
        TaxRate = newTaxRate;
    }

    function setTaxCollector (address newTaxCollector) external onlyRole(DEFAULT_ADMIN_ROLE) {
        TaxCollector = newTaxCollector;
    }

    function setNodeAddress(address newNodeAddress) external onlyRole(DEFAULT_ADMIN_ROLE) {
        defoNode = newNodeAddress;
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
