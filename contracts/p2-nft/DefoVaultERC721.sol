// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract DefoVaultNFT is ERC721Enumerable, Ownable {
    uint256 public constant SAPPHIRE_TIER = 1;
    uint256 public constant RUBY_TIER = 2;
    uint256 public constant DIAMOND_TIER = 3;
    uint256 public constant EMERALD_TIER = 4;

    using Strings for uint256;

    /// @notice tokenId => token tier (sapphire, ruby, diamond, emerald)
    mapping(uint256 => uint256) public tokenTiers;

    /// @dev tier => token url
    mapping(uint256 => string) private _tierURIs;

    /// @dev tier => url
    string private _baseURIextended;

    event URI(uint256 indexed tier, string indexed uri);

    constructor() ERC721("DEFO Vault NFT collection", "DEFOVault") {
        setTierURI(SAPPHIRE_TIER, "https://defo-vault.s3.amazonaws.com/metadata-sapphire.json");
        setTierURI(RUBY_TIER, "https://defo-vault.s3.amazonaws.com/metadata-ruby.json");
        setTierURI(DIAMOND_TIER, "https://defo-vault.s3.amazonaws.com/metadata-diamond.json");
        setTierURI(EMERALD_TIER, "https://defo-vault.s3.amazonaws.com/metadata-emerald.json");
    }


    function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
        require(_exists(tokenId), "ERC721Metadata: URI query for nonexistent token");
        uint256 tier = tokenTiers[tokenId];
        return _tierURIs[tier];
    }

    function setTierURI(uint256 tier, string memory tokenURI) public onlyOwner {
        _tierURIs[tier] = tokenURI;
        emit URI(tier, tokenURI);
    }

    function mint(address to, uint256 tier) public onlyOwner {
        uint256 tokenId = totalSupply();
        tokenTiers[tokenId] = tier;
        _mint(to, tokenId);
    }

    function batchMint(address to, uint256 tier, uint256 amount) public onlyOwner {
        uint256 tokenId = totalSupply();
        for (uint256 i = 0; i < amount; i++) {
            tokenTiers[tokenId + i] = tier;
            _mint(to, tokenId + i);
        }
    }

}



