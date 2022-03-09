//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockDAI is ERC20 {
    mapping(address => mapping(address => uint256)) public _allowances;

    constructor() ERC20("Mock DAI", "MDAI") {}

    function mintTokens(address _to, uint256 _amount) public {
        _mint(_to, _amount);
    }

    function getBalance(address _balanceWanted) public view returns (uint256) {
        return (balanceOf(_balanceWanted));
    }

}
