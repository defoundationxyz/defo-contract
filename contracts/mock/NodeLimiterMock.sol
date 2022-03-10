//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Limiter {
    constructor() {}

    function transferLog(
        address to,
        address from,
        uint256 tokenId
    ) external returns (bool) {
        return (from == address(0));
    }
}
