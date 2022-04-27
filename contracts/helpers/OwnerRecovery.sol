//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "hardhat/console.sol";


abstract contract OwnerRecovery is Ownable{
    
    // function recoverLostAVAX() external onlyOwner {
    //     payable(owner()).transfer(address(this).balance);
    // }

    //This will help us recover the funds from the contract. As of now only Defo and avax should be in pool.  
    function recoverLostTokens(address _token,address _to,uint256 _amount) external onlyOwner {
        IERC20(_token).transfer(_to, _amount);
    }
}
