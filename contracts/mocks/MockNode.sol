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

    enum Booster {
        None,
        Delta,
        Omega
    }
    constructor() ERC721("Mock Defo Node", "MDN") {}
    function RedeemMint(NodeType _type, address _to) public {
        _mintGem(_type, _to);
    }

    function RedeemMintBooster(
        NodeType _type,
        Booster _booster,
        address _to
    ) public {
        _mintGem(_type, _to);
        
    }

    function _mintGem (NodeType _type, address _to) internal {
        _tokenIdCounter.increment();
        uint256 tokenId = _tokenIdCounter.current();
        _safeMint(_to, tokenId);
    }
}