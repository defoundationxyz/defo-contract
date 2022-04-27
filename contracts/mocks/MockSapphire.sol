//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract MockSapphire is ERC721Enumerable, Ownable{
    using SafeMath for uint256;
    using Counters for Counters.Counter;
    Counters.Counter private supply;


    uint256 public sapphireNodePrice = 540;
    string private baseURI;

    IERC20 DAIToken;
    constructor(address DAI_address) ERC721("Defo MockSapphire Node", "DmSN") {
        DAIToken = IERC20(DAI_address);
    }

    function mintNode() public payable {
        

        //DAIToken.transferFrom(msg.sender, address(this), sapphireNodePrice);
        supply.increment();
        _safeMint(msg.sender, supply.current());
    
    }
    function _baseURI() internal view virtual override returns (string memory) {
        return baseURI;
    }
    function totalSupply() public view override returns(uint256) {
        return (supply.current());
    }
}