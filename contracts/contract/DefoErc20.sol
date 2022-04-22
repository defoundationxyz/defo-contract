//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "./helpers/OwnerRecovery.sol";
import "./implementations/LpManagerImplementationPoint.sol";
import "hardhat/console.sol";

//Sole purpose of testing lp manager
contract Defo is ERC20, ERC20Burnable, Ownable, OwnerRecovery, LpManagerImplementationPoint{
    mapping(address => uint256) private _balances;
    mapping (address=>bool) isExemptFee;
    uint256 public _totalSupply = 200000*1e18;
    uint256 MAXSELLLIMIT = _totalSupply / 1000;

    struct LastSell{
        uint256 time;
        uint256 amount;
    }

    mapping(address => LastSell) public lastSells;
    
    constructor() ERC20("Defo Token","DEFO"){
        _mint(owner(), _totalSupply);
        isExemptFee[owner()] = true;
    }

    function _afterTokenTransfer(address from, address to, uint256 amount) internal virtual override {
        super._afterTokenTransfer(from, to, amount);
        if (address(lpPoolManager) != address(0)) {
            lpPoolManager.afterTokenTransfer(_msgSender());
        }
    }


}