// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.15;

/** @title  ILimiter, limiter for yield gem transfer
  * @author Decentralized Foundation Team
*/

interface ILimiter {
    function transferLimit(
        address to,
        address from,
        uint256 tokenId
    ) external;
}
