//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

/// @title Defo Sapphire Omega Node Minting Contract
/// @notice Contract for minting sapphire nodes

contract MockOmegaDiamond is ERC721Enumerable, Ownable {
    using SafeMath for uint256;
    using Counters for Counters.Counter;
    Counters.Counter private supply;

    uint256 public diamondOmegaNodePrice = 2000;
    uint256 constant DECIMAL_MULTIPLIER = 10 ** 18;
    string private baseURI;
    IERC20 DAIToken;

    constructor(address DAI_address)
        ERC721("Defo Diamond Omega Node", "DDON")
    {
        DAIToken = IERC20(DAI_address);
    }

    /// @notice allows users to mint sapphire nodes
    function mintNode(uint256 amount) public {
        // require(
        //     DAIToken.balanceOf(msg.sender) >=
        //         (diamondOmegaNodePrice * DECIMAL_MULTIPLIER) * amount,
        //     "Insuffucient DAI balance"
        // );

        // DAIToken.transferFrom(
        //     msg.sender,
        //     address(this),
        //     (diamondOmegaNodePrice * DECIMAL_MULTIPLIER) * amount
        // );
        for (uint256 index = 0; index < amount; index++) {
            supply.increment();
            _safeMint(msg.sender, supply.current());
        }
    }

    /// @notice returns the baseURI
    function _baseURI() internal view virtual override returns (string memory) {
        return baseURI;
    }
    function totalSupply() public view override returns (uint256) {
        return (supply.current());
    }
}