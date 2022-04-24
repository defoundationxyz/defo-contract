//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface ILeftSideImplementation is IERC20 {
    function owner() external view returns (address);

}
