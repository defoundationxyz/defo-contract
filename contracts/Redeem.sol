//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import '@openzeppelin/contracts/utils/math/SafeMath.sol';

contract Redeem is Ownable{
    using SafeMath for uint;

    bool locked;
    bool redeemActive;
    address private nodeAddress;
    address private sapphireAddress;
    address private rubyAddress;
    address private diamondAddress;
    uint256 private complianceEndTime;
    uint256 private complianceStartTime;

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

    modifier presaleCompliance(uint256[] memory _tokenIds){
        require (
            ISapphirePresale.balanceOf(msg.sender) > 0 ||
            IRubyPresale.balanceOf(msg.sender) > 0 ||
            IDiamondPresale.balanceOf(msg.sender) > 0 ,
            "You are not in possesion of any presale nodes"
        );

        for (uint256 i = 0; i <= _tokenIds.length - 1; i++) {
            require (
                ISapphirePresale.ownerOf(_tokenIds[i]) == msg.sender ||
                IRubyPresale.ownerOf(_tokenIds[i]) == msg.sender ||
                IDiamondPresale.ownerOf(_tokenIds[i]) == msg.sender ,
                "Wrong wallet maybe?"
            );
        }
        _;
    }

    modifier timeCompliance() {
        require (
            block.timestamp < complianceEndTime &&
            block.timestamp > complianceStartTime,
            "Either too late or too early"
        );
        _;
    }

    /// add if statement to check balance and get approval
    /// add for loop for each balance
    function redeem(uint256[] memory _tokenIds)
        public
        isActive
        nonReentrant
        presaleCompliance(_tokenIds)
        timeCompliance
        {
            uint256 redeemSapphireBalance = ISapphirePresale.balanceOf(msg.sender);
            uint256 redeemRubyBalance = IRubyPresale.balanceOf(msg.sender);
            uint256 redeemDiamondBalance = IDiamondPresale.balanceOf(msg.sender);
        }
    
    /// add if to check if address was changed successfully
    function setNodeAddress(address newNodeAddress) public onlyOwner returns(address) {
        nodeAddress = newNodeAddress;
        return(nodeAddress);
    }

    function startTimer() public onlyOwner returns(uint256, uint256) {
        complianceStartTime = block.timestamp;
        complianceEndTime = block.timestamp + 2 weeks;
        return(complianceStartTime, complianceEndTime);
    }

    
}
