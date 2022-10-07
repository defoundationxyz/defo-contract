//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;


interface IPresaleNode {
    function mintNode() external;

    function giveAwayMint() external;

    function setMaxTotalDiamondNodes(uint64 _newNodeAmount) external;

    function setSaleState() external;

    ///@notice allows the owner to set the max amount of nodes one wallet can hold
    function setMaxPerWallet(uint64 _newAmount) external;

    function setBaseURI(string memory _tokenBaseURI) external;

    function totalSupply() external view returns (uint256);

    function setTransferLock() external;

    function addToWhitelist(address _whitelistedAddress) external;

    function getPrice() external view returns (uint256);

    function tokenByIndex(uint256 index) external view returns (uint256);

    function balanceOf(address owner) external view returns (uint256);

    function ownerOf(uint256 tokenId) external view returns (address);

}
