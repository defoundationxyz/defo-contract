//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/IERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import '@openzeppelin/contracts/utils/math/SafeMath.sol';
import './interface/INode.sol';

contract Redeem is Ownable, INode{
    using SafeMath for uint;

    bool locked;
    bool redeemActive;
    INode nodeContract;
    IERC721Enumerable sapphirePresale;
    IERC721Enumerable rubyPresale;
    IERC721Enumerable diamondPresale;
    uint256 private complianceEndTime;
    uint256 private complianceStartTime;
    constructor(address _nodeAddress, address _sapphireAddress, address _rubyAddress, address _diamondAddress) {
        redeemActive = true;
        nodeContract = INode(_nodeAddress);
        sapphirePresale = IERC721Enumerable(_sapphireAddress);
        rubyPresale = IERC721Enumerable(_rubyAddress);
        diamondPresale = IERC721Enumerable(_diamondAddress);
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


    /// @dev removed ownership check since implementing OZ enumerable because input of token IDs is no longer needed
    modifier presaleCompliance(){
        require (
            sapphirePresale.balanceOf(msg.sender) > 0 ||
            rubyPresale.balanceOf(msg.sender) > 0 ||
            diamondPresale.balanceOf(msg.sender) > 0,
            "You are not in possesion of any presale nodes"
        );
        _;
    }

    modifier timeCompliance() {
        if (!(block.timestamp <= complianceEndTime && block.timestamp >= complianceStartTime)) {
            redeemActive = false;
        }

        require (
            block.timestamp <= complianceEndTime &&
            block.timestamp >= complianceStartTime,
            "Either too late or too early"
        );
        _;
    }

    function setNodeAddress(address newNodeAddress) public onlyOwner returns(address) {
        nodeContract = INode(newNodeAddress);
        return(address(nodeContract));
    }

    function startTimer() public onlyOwner returns(uint256, uint256) {
        complianceStartTime = block.timestamp;
        complianceEndTime = block.timestamp + 2 weeks;
        return(complianceStartTime, complianceEndTime);
    }

    function flipActive() public onlyOwner {
        redeemActive = !redeemActive;
    }

    /// add an event?
    function redeem()
        public
        isActive
        nonReentrant
        presaleCompliance
        timeCompliance
        {
            uint256 redeemSapphireBalance = sapphirePresale.balanceOf(msg.sender);
            uint256 redeemRubyBalance = rubyPresale.balanceOf(msg.sender);
            uint256 redeemDiamondBalance = diamondPresale.balanceOf(msg.sender);

            if (redeemSapphireBalance > 0 ) {
                sapphirePresale.setApprovalForAll(address(this), true);
                for (uint256 i = 0; i <= redeemSapphireBalance - 1; i++) {
                    sapphirePresale.transferFrom(
                        msg.sender,
                        address(0),
                        sapphirePresale.tokenOfOwnerByIndex(msg.sender, i) ///@dev change to enumerable index, as opposed to input index
                    );
                    nodeContract.RedeemMint(nodeContract.NodeType.Ruby, msg.sender);
                }
            } else if (redeemRubyBalance > 0 ) {
                rubyPresale.setApprovalForAll(address(this), true);
                for (uint256 i = 0; i <= redeemRubyBalance - 1; i++) {
                    rubyPresale.transferFrom(
                        msg.sender,
                        address(0),
                        rubyPresale.tokenOfOwnerByIndex(msg.sender, i)
                    );
                    // nodeContract.RedeemMint(0, msg.sender);
                }
            } else if (redeemDiamondBalance > 0 ) {
                diamondPresale.setApprovalForAll(address(this), true);
                for (uint256 i = 0; i <= redeemDiamondBalance - 1; i++) {
                    diamondPresale.transferFrom(
                        msg.sender,
                        address(0),
                        diamondPresale.tokenOfOwnerByIndex(msg.sender, i)
                    );
                    // nodeContract.RedeemMint(2, msg.sender);
                }
            }
        }
}
