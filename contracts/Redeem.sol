//SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "hardhat/console.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/IERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "./interfaces/INode.sol";

contract Redeem is Ownable {
    using SafeMath for uint256;

    ///Presale contract addresses
    IERC721Enumerable sapphirePresale;
    IERC721Enumerable rubyPresale;
    IERC721Enumerable diamondPresale;
    IERC721Enumerable diamondDeltaPresale;
    IERC721Enumerable diamondOmegaPresale;
    IERC721Enumerable rubyDeltaPresale;
    IERC721Enumerable rubyOmegaPresale;
    IERC721Enumerable sapphireDeltaPresale;
    IERC721Enumerable sapphireOmegaPresale;

    INode nodeContract;
    bool private locked;
    bool public redeemActive;
    uint256 private complianceEndTime;
    uint256 private complianceStartTime;

    constructor(
        address _nodeAddress,
        address _sapphireAddress,
        address _rubyAddress,
        address _diamondAddress,
        address _sapphireDeltaPresale,
        address _sapphireOmegaPresale,
        address _rubyDeltaPresale,
        address _rubyOmegaPresale,
        address _diamondDeltaPresale,
        address _diamondOmegaPresale
    ) {
        redeemActive = true;
        nodeContract = INode(_nodeAddress);
        sapphirePresale = IERC721Enumerable(_sapphireAddress);
        rubyPresale = IERC721Enumerable(_rubyAddress);
        diamondPresale = IERC721Enumerable(_diamondAddress);
        sapphireDeltaPresale = IERC721Enumerable(_sapphireDeltaPresale);
        sapphireOmegaPresale = IERC721Enumerable(_sapphireOmegaPresale);
        rubyDeltaPresale = IERC721Enumerable(_rubyDeltaPresale);
        rubyOmegaPresale = IERC721Enumerable(_rubyOmegaPresale);
        diamondDeltaPresale = IERC721Enumerable(_diamondDeltaPresale);
        diamondOmegaPresale = IERC721Enumerable(_diamondOmegaPresale);
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

    modifier presaleCompliance() {
        require(
            sapphirePresale.balanceOf(msg.sender) > 0 ||
                rubyPresale.balanceOf(msg.sender) > 0 ||
                diamondPresale.balanceOf(msg.sender) > 0,
            "You are not in possesion of any presale nodes"
        );
        _;
    }

    modifier secondPresaleCompliance() {
        require(
            sapphireDeltaPresale.balanceOf(msg.sender) > 0 ||
                sapphireOmegaPresale.balanceOf(msg.sender) > 0 ||
                rubyDeltaPresale.balanceOf(msg.sender) > 0 ||
                rubyOmegaPresale.balanceOf(msg.sender) > 0 ||
                diamondDeltaPresale.balanceOf(msg.sender) > 0 ||
                diamondOmegaPresale.balanceOf(msg.sender) > 0,
            "You are not in possesion of any second presale nodes"
        );
        _;
    }

    modifier timeCompliance() {
        if (!(block.timestamp >= complianceStartTime && block.timestamp <= complianceEndTime)) {
            redeemActive = false;
        }

        require(
            block.timestamp >= complianceStartTime && block.timestamp <= complianceEndTime,
            "Either too early or too late"
        );
        _;
    }

    function setNodeAddress(address newNodeAddress) public onlyOwner returns (address) {
        nodeContract = INode(newNodeAddress);
        return (address(nodeContract));
    }

    function startTimer() public onlyOwner returns (uint256, uint256) {
        complianceStartTime = block.timestamp;
        complianceEndTime = block.timestamp + 2 weeks;
        return (complianceStartTime, complianceEndTime);
    }

    function flipActive() public onlyOwner {
        redeemActive = !redeemActive;
    }

    /// @dev the redeeming and burning counting is separated by for loop
    function redeem() public isActive nonReentrant presaleCompliance timeCompliance {
        uint256 redeemSapphireBalance = sapphirePresale.balanceOf(msg.sender);
        uint256 redeemRubyBalance = rubyPresale.balanceOf(msg.sender);
        uint256 redeemDiamondBalance = diamondPresale.balanceOf(msg.sender);

        if (redeemSapphireBalance > 0) {
            /// sapphire redeem
            for (uint256 i = 0; i < redeemSapphireBalance; i++) {
                nodeContract.RedeemMint(1, msg.sender);
            }
            /// this is the burning logic
            for (uint256 i = 0; i < redeemSapphireBalance - 1; i++) {
                sapphirePresale.transferFrom(
                    msg.sender,
                    address(0x000000000000000000000000000000000000dEaD),
                    sapphirePresale.tokenOfOwnerByIndex(msg.sender, i)
                );
            }
            sapphirePresale.transferFrom(
                msg.sender,
                address(0x000000000000000000000000000000000000dEaD),
                sapphirePresale.tokenOfOwnerByIndex(msg.sender, 0)
            );
        }
        /// ruby redeem
        if (redeemRubyBalance > 0) {
            for (uint256 i = 0; i < redeemRubyBalance; i++) {
                nodeContract.RedeemMint(0, msg.sender);
            }
            for (uint256 i = 0; i < redeemRubyBalance - 1; i++) {
                rubyPresale.transferFrom(
                    msg.sender,
                    address(0x000000000000000000000000000000000000dEaD),
                    rubyPresale.tokenOfOwnerByIndex(msg.sender, i)
                );
            }
            rubyPresale.transferFrom(
                msg.sender,
                address(0x000000000000000000000000000000000000dEaD),
                rubyPresale.tokenOfOwnerByIndex(msg.sender, 0)
            );
        }
        /// diamond redeem
        if (redeemDiamondBalance > 0) {
            for (uint256 i = 0; i < redeemDiamondBalance; i++) {
                nodeContract.RedeemMint(2, msg.sender);
            }
            for (uint256 i = 0; i < redeemDiamondBalance - 1; i++) {
                diamondPresale.transferFrom(
                    msg.sender,
                    address(0x000000000000000000000000000000000000dEaD),
                    diamondPresale.tokenOfOwnerByIndex(msg.sender, i)
                );
            }
            diamondPresale.transferFrom(
                msg.sender,
                address(0x000000000000000000000000000000000000dEaD),
                diamondPresale.tokenOfOwnerByIndex(msg.sender, 0)
            );
        }
    }

    function secondPresaleRedeem() public isActive nonReentrant secondPresaleCompliance timeCompliance {
        uint256 redeemSapphireDeltaBalance = sapphireDeltaPresale.balanceOf(msg.sender);
        uint256 redeemSapphireOmegaBalance = sapphireOmegaPresale.balanceOf(msg.sender);
        uint256 redeemRubyDeltaBalance = rubyDeltaPresale.balanceOf(msg.sender);
        uint256 redeemRubyOmegaBalance = rubyOmegaPresale.balanceOf(msg.sender);
        uint256 redeemDiamondDeltaBalance = diamondDeltaPresale.balanceOf(msg.sender);
        uint256 redeemDiamondOmegaBalance = diamondOmegaPresale.balanceOf(msg.sender);

        if (redeemSapphireDeltaBalance > 0) {
            for (uint256 i = 0; i < redeemSapphireDeltaBalance; i++) {
                nodeContract.RedeemMintBooster(1, INode.Booster.Delta, msg.sender);
            }

            for (uint256 i = 0; i < redeemSapphireDeltaBalance - 1; i++) {
                sapphireDeltaPresale.transferFrom(
                    msg.sender,
                    address(0x000000000000000000000000000000000000dEaD),
                    sapphireDeltaPresale.tokenOfOwnerByIndex(msg.sender, i)
                );
            }
            sapphireDeltaPresale.transferFrom(
                msg.sender,
                address(0x000000000000000000000000000000000000dEaD),
                sapphireDeltaPresale.tokenOfOwnerByIndex(msg.sender, 0)
            );
        }

        if (redeemSapphireOmegaBalance > 0) {
            for (uint256 i = 0; i < redeemSapphireOmegaBalance; i++) {
                nodeContract.RedeemMintBooster(1, INode.Booster.Omega, msg.sender);
            }

            for (uint256 i = 0; i < redeemSapphireOmegaBalance - 1; i++) {
                sapphireOmegaPresale.transferFrom(
                    msg.sender,
                    address(0x000000000000000000000000000000000000dEaD),
                    sapphireOmegaPresale.tokenOfOwnerByIndex(msg.sender, i)
                );
            }
            sapphireOmegaPresale.transferFrom(
                msg.sender,
                address(0x000000000000000000000000000000000000dEaD),
                sapphireOmegaPresale.tokenOfOwnerByIndex(msg.sender, 0)
            );
        }

        if (redeemRubyDeltaBalance > 0) {
            for (uint256 i = 0; i < redeemRubyDeltaBalance; i++) {
                nodeContract.RedeemMintBooster(0, INode.Booster.Delta, msg.sender);
            }

            for (uint256 i = 0; i < redeemRubyDeltaBalance - 1; i++) {
                rubyDeltaPresale.transferFrom(
                    msg.sender,
                    address(0x000000000000000000000000000000000000dEaD),
                    rubyDeltaPresale.tokenOfOwnerByIndex(msg.sender, i)
                );
            }
            rubyDeltaPresale.transferFrom(
                msg.sender,
                address(0x000000000000000000000000000000000000dEaD),
                rubyDeltaPresale.tokenOfOwnerByIndex(msg.sender, 0)
            );
        }

        if (redeemRubyOmegaBalance > 0) {
            for (uint256 i = 0; i < redeemRubyOmegaBalance; i++) {
                nodeContract.RedeemMintBooster(0, INode.Booster.Omega, msg.sender);
            }

            for (uint256 i = 0; i < redeemRubyOmegaBalance - 1; i++) {
                rubyOmegaPresale.transferFrom(
                    msg.sender,
                    address(0x000000000000000000000000000000000000dEaD),
                    rubyOmegaPresale.tokenOfOwnerByIndex(msg.sender, i)
                );
            }
            rubyOmegaPresale.transferFrom(
                msg.sender,
                address(0x000000000000000000000000000000000000dEaD),
                rubyOmegaPresale.tokenOfOwnerByIndex(msg.sender, 0)
            );
        }

        if (redeemDiamondDeltaBalance > 0) {
            for (uint256 i = 0; i < redeemDiamondDeltaBalance; i++) {
                nodeContract.RedeemMintBooster(2, INode.Booster.Delta, msg.sender);
            }

            for (uint256 i = 0; i < redeemDiamondDeltaBalance - 1; i++) {
                diamondDeltaPresale.transferFrom(
                    msg.sender,
                    address(0x000000000000000000000000000000000000dEaD),
                    diamondDeltaPresale.tokenOfOwnerByIndex(msg.sender, i)
                );
            }
            diamondDeltaPresale.transferFrom(
                msg.sender,
                address(0x000000000000000000000000000000000000dEaD),
                diamondDeltaPresale.tokenOfOwnerByIndex(msg.sender, 0)
            );
        }

        if (redeemDiamondOmegaBalance > 0) {
            for (uint256 i = 0; i < redeemDiamondOmegaBalance; i++) {
                nodeContract.RedeemMintBooster(2, INode.Booster.Omega, msg.sender);
            }

            for (uint256 i = 0; i < redeemDiamondOmegaBalance - 1; i++) {
                diamondOmegaPresale.transferFrom(
                    msg.sender,
                    address(0x000000000000000000000000000000000000dEaD),
                    diamondOmegaPresale.tokenOfOwnerByIndex(msg.sender, i)
                );
            }
            diamondOmegaPresale.transferFrom(
                msg.sender,
                address(0x000000000000000000000000000000000000dEaD),
                diamondOmegaPresale.tokenOfOwnerByIndex(msg.sender, 0)
            );
        }
    }
}
