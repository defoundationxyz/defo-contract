// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.15;

interface IDEXRouter02 {
    function swapExactTokensForTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external returns (uint256[] memory amounts);
}
