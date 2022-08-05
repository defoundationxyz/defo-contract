// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.15;

/** @title  ILimiter, limiter for DEFO token transfer
  * @author Decentralized Foundation Team
*/

interface ILimiter {
    function yieldGemTransferLimit(
        address to,
        address from,
        uint256 tokenId
    ) external;

    function DEFOTokenTransferLimit(
        address to,
        address from,
        uint256 amount
    ) external;
}
