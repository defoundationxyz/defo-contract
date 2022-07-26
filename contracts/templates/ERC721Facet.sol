// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.9;

import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/utils/introspection/ERC165.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/IERC721Metadata.sol";
import {LibDiamond} from "hardhat-deploy/solc_0.8/diamond/libraries/LibDiamond.sol";
import {FacetReady} from "../storage/StorageAndModifiers.sol";

/** @title  ERC721PausableFacet EIP-2535 Diamond Facet
  * @author Decentralized Foundation Team
  * @notice The Contract uses diamond storage providing functionality of ERC721, ERC721Pausable
*/
contract ERC721Facet is FacetReady, ERC165, IERC721, IERC721Metadata {
    using Strings for uint256;

    bytes4 internal constant ERC721_RECEIVED = 0x150b7a02;

    function safeTransferFrom(
        address _from,
        address _to,
        uint256 _tokenId,
        bytes memory _data
    ) public virtual {
        address sender = _msgSender();
        require(
            _isApprovedOrOwner(sender, _tokenId),
            "ERC721: transfer caller is not owner nor approved"
        );
        _checkOnERC721Received(sender, _from, _to, _tokenId, _data);
        _transfer(_from, _to, _tokenId);
    }

    function safeTransferFrom(
        address _from,
        address _to,
        uint256 _tokenId
    ) public virtual {
        safeTransferFrom(_from, _to, _tokenId, "");
    }


    function transferFrom(
        address from,
        address to,
        uint256 tokenId
    ) external {
        safeTransferFrom(from, to, tokenId, "");
    }


    function approve(address to, uint256 tokenId) external {
        address owner = _ownerOf(tokenId);
        require(to != owner, "ERC721: approval to current owner");

        require(
            _msgSender() == owner || _isApprovedForAll(owner, _msgSender()),
            "ERC721: approve caller is not owner nor approved for all"
        );

        _approve(to, tokenId);
    }

    function setApprovalForAll(address operator, bool _approved) external {
        address owner = _msgSender();
        require(owner != operator, "ERC721: approve to caller");
        s.nft.operatorApprovals[owner][operator] = _approved;
        emit ApprovalForAll(owner, operator, _approved);
    }

    function balanceOf(address _owner) external view nonZeroAddress(_owner) returns (uint256 balance) {
        return s.nft.balances[_owner];
    }

    function ownerOf(uint256 tokenId) external view returns (address) {
        return _ownerOf(tokenId);
    }

    function getApproved(uint256 tokenId) external view returns (address operator){
        return s.nft.tokenApprovals[tokenId];
    }

    function isApprovedForAll(address owner, address operator) external view returns (bool){
        return s.nft.operatorApprovals[owner][operator];
    }

    function name() public view virtual returns (string memory) {
        return s.nft.name;
    }

    function symbol() public view virtual returns (string memory) {
        return s.nft.symbol;
    }

    function tokenURI(uint256 tokenId) public view virtual exists(tokenId) returns (string memory) {
        string memory baseURI = s.nft.baseURI;
        return bytes(baseURI).length > 0 ? string(abi.encodePacked(baseURI, tokenId.toString())) : "";
    }

    /* ============ Internal Functions ============ */

    function _transfer(
        address from,
        address to,
        uint256 tokenId
    ) internal {
        require(_ownerOf(tokenId) == from, "ERC721: transfer from incorrect owner");
        require(to != address(0), "ERC721: transfer to the zero address");
        _beforeTokenTransfer(from, to, tokenId);

        // Clear approvals from the previous owner
        _approve(address(0), tokenId);

        s.nft.balances[from]--;
        s.nft.balances[to]++;
        s.nft.owners[tokenId] = to;

        emit Transfer(from, to, tokenId);

        _afterTokenTransfer(address(0), to, tokenId);
    }

    function _approve(address to, uint256 tokenId) internal {
        s.nft.tokenApprovals[tokenId] = to;
        emit Approval(_ownerOf(tokenId), to, tokenId);
    }

    function _checkOnERC721Received(
        address _operator,
        address _from,
        address _to,
        uint256 _tokenId,
        bytes memory _data
    ) internal {
        uint256 size;
        assembly {
            size := extcodesize(_to)
        }
        if (size > 0) {
            require(
                ERC721_RECEIVED == IERC721Receiver(_to).onERC721Received(_operator, _from, _tokenId, _data),
                "DefoERC721Facet: Transfer rejected/failed by _to"
            );
        }
    }

    function _isApprovedOrOwner(address _spender, uint256 _tokenId) internal view exists(_tokenId) returns (bool) {
        address owner = _ownerOf(_tokenId);
        return (_spender == owner || _isApprovedForAll(owner, _spender) || _getApproved(_tokenId) == _spender);
    }

    function _isApprovedForAll(address owner, address operator) internal view returns (bool) {
        return s.nft.operatorApprovals[owner][operator];
    }

    function _ownerOf(uint256 _tokenId) internal view exists(_tokenId) returns (address) {
        return s.nft.owners[_tokenId];
    }

    function _getApproved(uint256 _tokenId) internal view exists(_tokenId) returns (address) {
        return s.nft.tokenApprovals[_tokenId];
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId
    ) internal virtual {}

    function _afterTokenTransfer(
        address from,
        address to,
        uint256 tokenId
    ) internal virtual {}

}
