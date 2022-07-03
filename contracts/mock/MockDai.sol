//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "hardhat/console.sol";

//Sole purpose of testing lp manager
contract MockDai is ERC20, Ownable{
    uint256 public _totalSupply = 200000*1e18;
    
    constructor() ERC20("Dai token","Dai"){
        _mint(owner(), _totalSupply);
    }

}