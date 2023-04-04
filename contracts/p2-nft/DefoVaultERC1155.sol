// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract DefoVaultNFT1155 is ERC1155URIStorage, Ownable {
    uint256 public constant SAPPHIRE_VAULT = 1;
    uint256 public constant RUBY_VAULT = 2;
    uint256 public constant DIAMOND_VAULT = 3;
    uint256 public constant EMERALD_VAULT = 4;

    uint256 public constant SAPPHIRE_SUPPLY = 200;
    uint256 public constant RUBY_SUPPLY = 150;
    uint256 public constant DIAMOND_SUPPLY = 100;
    uint256 public constant EMERALD_SUPPLY = 50;

    string public constant name = "DEFO Vault";

    constructor() ERC1155("") Ownable(){
        _mint(msg.sender, SAPPHIRE_VAULT, SAPPHIRE_SUPPLY, "");
        _mint(msg.sender, RUBY_VAULT, RUBY_SUPPLY, "");
        _mint(msg.sender, DIAMOND_VAULT, DIAMOND_SUPPLY, "");
        _mint(msg.sender, EMERALD_VAULT, EMERALD_SUPPLY, "");
        _setURI(SAPPHIRE_VAULT, "https://defo-vault.s3.amazonaws.com/metadata-sapphire.json");
        _setURI(RUBY_VAULT, "https://defo-vault.s3.amazonaws.com/metadata-ruby.json");
        _setURI(DIAMOND_VAULT, "https://defo-vault.s3.amazonaws.com/metadata-diamond.json");
        _setURI(EMERALD_VAULT, "https://defo-vault.s3.amazonaws.com/metadata-emerald.json");
    }

    function setURI(uint256 tokenId, string memory tokenURI) public onlyOwner
    {
        _setURI(tokenId, tokenURI);
    }

}
