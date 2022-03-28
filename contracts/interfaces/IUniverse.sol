//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IUniverse is IERC20 {
    function owner() external view returns (address);

    function accountBurn(address account, uint256 amount) external;

    function accountReward(address account, uint256 amount) external;

    function liquidityReward(uint256 amount) external;
}
