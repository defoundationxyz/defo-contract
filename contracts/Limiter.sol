//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./interfaces/IERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract Limiter is AccessControl {
    mapping(address => uint256) TransferLog;

    // minimum allowed time between transfers
    uint256 TimeLimit;
    // tax rate tax only applies to non-whitelisted addresses
    uint256 TaxRate;

    address public TaxCollector;
    //limiter must be pre-approved by taxed token
    address public TaxedToken;

    //don't tax addresses like limiter , lp and null address
    mapping(address => bool) Whitelist;

    mapping(address => bool) Blocklist;

    constructor(uint256 _timeLimit, address _taxCollector) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        TimeLimit = _timeLimit;
        TaxCollector = _taxCollector;
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
            uint256 taxedamount = (amount * TaxRate) / 100;
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
