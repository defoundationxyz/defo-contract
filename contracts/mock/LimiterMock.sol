//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Limiter {
    // wallet -> last transfer block number mapping
    mapping(address => uint256) TransferLog;
    // minimum transfer limit in blocks
    uint256 TimeLimit;

    constructor(uint256 _timeLimit) {
        TimeLimit = _timeLimit;
    }

    // @dev only for testing trade limit mechanism not optimized don't use in production
    // basic time limit enforcing by last transfer control
    function transferLog(
        address to,
        address from,
        uint256 amount
    ) external returns (bool) {
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
