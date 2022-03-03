//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Redeem is Ownable{

    bool locked;
    bool redeemActive;
    address private nodeAddress;
    address private sapphireAddress;
    address private rubyAddress;
    address private diamondAddress;

    IERC721 ISapphirePresale = IERC721(sapphireAddress);
    IERC721 IRubyPresale = IERC721(rubyAddress);
    IERC721 IDiamondPresale = IERC721(diamondAddress);
    constructor(address _nodeAddress, address _sapphireAddress, address _rubyAddress, address _diamondAddress) {
        redeemActive = true;
        nodeAddress = _nodeAddress;
        sapphireAddress = _sapphireAddress;
        rubyAddress = _rubyAddress;
        diamondAddress = _diamondAddress;
    }

    modifier isActive() {
        require(redeemActive == true, "Redeeming is not currently active");
        _;
    }

    modifier nonReentrant() {
        require(!locked, "No re-entrancy");
        locked = true;
        _;
        locked = false;
    }

    function timeCheck() public {}
    function redeem() public isActive nonReentrant {}
    
    /// add if to check if address was changed successfully 
    function setNodeAddress(address newNodeAddress) public onlyOwner returns(address) {
        nodeAddress = newNodeAddress;
        return(nodeAddress);

    
}
