//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../interfaces/IERC20.sol";

// just a test contract for testing limiter and tax mechanisms
contract Limiter {
    // wallet -> last transfer block number mapping
    mapping(address => uint256) TransferLog;
    // minimum transfer limit in blocks
    uint256 TimeLimit;
    address public TaxCollector;
    address public Token;

    constructor(uint256 _timeLimit, address _taxCollector) {
        TimeLimit = _timeLimit;
        TaxCollector = _taxCollector;
    }

    function setToken(address _token) external {
        Token = _token;
    }

    // @dev only for testing trade limit mechanism not optimized don't use in production
    // basic time limit enforcing by last transfer control
    function transferLog(
        address to,
        address from,
        uint256 amount
    ) external returns (bool) {
        if (to == TaxCollector) {
            return true;
        }

        if (from == address(0)) {
            return true;
        }

        if (Token != address(0)) {
            uint256 taxedamount = (amount * 20) / 100;
            IERC20 token = IERC20(Token);
            token.transferFrom(from, TaxCollector, taxedamount);
        }

        if (TransferLog[from] != 0) {
            if (block.number - TransferLog[from] > TimeLimit) {
                TransferLog[from] = block.number;
                return true;
            } else {
                return false;
            }
        } else {
            TransferLog[from] = block.number;
            return true;
        }
    }
}
