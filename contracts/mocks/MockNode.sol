//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
contract MockNode is ERC721Enumerable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIdCounter;
    

    enum NodeType {
        Sapphire,
        Ruby,
        Diamond
    }
    constructor() ERC721("Mock Defo Node", "MDN") {}
    function RedeemMint(NodeType _type, address _to) public {
        _mintNode(_type, _to);
    }

    function _mintNode (NodeType _type, address _to) internal {
        _tokenIdCounter.increment();
        uint256 tokenId = _tokenIdCounter.current();
        _safeMint(_to, tokenId);
    }
}