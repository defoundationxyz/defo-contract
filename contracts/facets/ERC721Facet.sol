// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;
import "../libraries/LibMeta.sol";
import "../libraries/LibERC721.sol";
import "../libraries/LibDiamond.sol";
import "../interfaces/IERC721.sol";
import "../interfaces/IERC721Metadata.sol";
import "../interfaces/IERC721Receiver.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/Context.sol";

/// @title ERC721 standard facet with diamond storage pattern
/// @author jvoljvolizka

/**
 *   @dev This contract is openzeppelin ERC721 implementation edited according to diamond storage pattern
 *   for information about facets and diamond tstorage please check EIP-2535
 */

contract ERC721Facet {
    using Address for address;
    using Strings for uint256;

    /**
     * @dev Initializes the contract by setting a `name` and a `symbol` to the token collection.
     */
    function initialize(string memory name_, string memory symbol_) public {
        LibERC721.DiamondStorage storage ds = LibERC721.diamondStorage();
        LibDiamond.enforceIsContractOwner();
        require(!ds.init, "already initialized");
        ds._name = name_;
        ds._symbol = symbol_;
        LibDiamond.DiamondStorage storage dsMain = LibDiamond.diamondStorage();
        dsMain.supportedInterfaces[type(IERC721).interfaceId] = true; //erc721
        dsMain.supportedInterfaces[type(IERC721Metadata).interfaceId] = true; //erc721-metadata
    }

    /**
     * @dev See {IERC721-balanceOf}.
     */
    function balanceOf(address owner) public view virtual returns (uint256) {
        return LibERC721._balanceOf(owner);
    }

    /**
     * @dev See {IERC721Metadata-name}.
     */
    function name() public view virtual returns (string memory) {
        LibERC721.DiamondStorage storage ds = LibERC721.diamondStorage();
        return ds._name;
    }

    /**
     * @dev See {IERC721Metadata-symbol}.
     */
    function symbol() public view virtual returns (string memory) {
        LibERC721.DiamondStorage storage ds = LibERC721.diamondStorage();
        return ds._symbol;
    }

    /**
     * @dev See {IERC721Metadata-tokenURI}.
     */
    function tokenURI(uint256 tokenId) public view virtual returns (string memory) {
        require(LibERC721._exists(tokenId), "ERC721Metadata: URI query for nonexistent token");

        string memory baseURI = _baseURI();
        return bytes(baseURI).length > 0 ? string(abi.encodePacked(baseURI, tokenId.toString())) : "";
    }

    /**
     * @dev Base URI for computing {tokenURI}. If set, the resulting URI for each
     * token will be the concatenation of the `baseURI` and the `tokenId`. Empty
     * by default, can be overridden in child contracts.
     */

    function _baseURI() internal view virtual returns (string memory) {
        LibERC721.DiamondStorage storage ds = LibERC721.diamondStorage();
        return ds.baseURI;
    }

    /**
     * @dev See {IERC721-ownerOf}.
     */
    function ownerOf(uint256 tokenId) public view returns (address) {
        return LibERC721._ownerOf(tokenId);
    }

    /**
     * @dev See {IERC721-getApproved}.
     */
    function getApproved(uint256 tokenId) public view returns (address) {
        return LibERC721._getApproved(tokenId);
    }

    /**
     * @dev See {IERC721-isApprovedForAll}.
     */
    function isApprovedForAll(address owner, address operator) public view returns (bool) {
        return LibERC721._isApprovedForAll(owner, operator);
    }

    /**
     * @dev See {IERC721-approve}.
     */
    function approve(address to, uint256 tokenId) public virtual {
        address owner = LibERC721._ownerOf(tokenId);
        require(to != owner, "ERC721: approval to current owner");

        require(
            LibMeta.msgSender() == owner || LibERC721._isApprovedForAll(owner, LibMeta.msgSender()),
            "ERC721: approve caller is not owner nor approved for all"
        );

        LibERC721._approve(to, tokenId);
    }

    /**
     * @dev See {IERC721-setApprovalForAll}.
     */
    function setApprovalForAll(address operator, bool approved) public virtual {
        LibERC721._setApprovalForAll(LibMeta.msgSender(), operator, approved);
    }

    /**
     * @dev See {IERC721-transferFrom}.
     */
    function transferFrom(
        address from,
        address to,
        uint256 tokenId
    ) public virtual {
        //solhint-disable-next-line max-line-length
        require(
            LibERC721._isApprovedOrOwner(LibMeta.msgSender(), tokenId),
            "ERC721: transfer caller is not owner nor approved"
        );

        LibERC721._transfer(from, to, tokenId);
    }

    /**
     * @dev See {IERC721-safeTransferFrom}.
     */
    function safeTransferFrom(
        address from,
        address to,
        uint256 tokenId
    ) public virtual {
        safeTransferFrom(from, to, tokenId, "");
    }

    /**
     * @dev See {IERC721-safeTransferFrom}.
     */
    function safeTransferFrom(
        address from,
        address to,
        uint256 tokenId,
        bytes memory _data
    ) public virtual {
        address sender = LibMeta.msgSender();
        require(
            LibERC721._isApprovedOrOwner(LibMeta.msgSender(), tokenId),
            "ERC721: transfer caller is not owner nor approved"
        );
        LibERC721.checkOnERC721Received(sender, from, to, tokenId, _data);
        LibERC721._transfer(from, to, tokenId);
    }
}
