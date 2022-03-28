//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "hardhat/console.sol";

//Sole purpose of testing lp manager
contract Defo is ERC20{
    uint256 public _totalSupply = 10000*18;
    
    constructor(address _owner) ERC20("Defo Token","DEFO"){
        _mint(_owner, _totalSupply);
    }

}