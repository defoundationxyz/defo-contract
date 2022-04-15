// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;
import "../libraries/LibERC721Storage.sol";
import "../libraries/LibMeta.sol";
import {LibERC721} from "../libraries/LibERC721.sol";
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
 *   for information about facets and diamond storage please check EIP-2535
 */

contract ERC721Facet {
    using Address for address;
    using Strings for uint256;

    /**
     * @dev Initializes the contract by setting a `name` and a `symbol` to the token collection.
     */
    /// TODO: add 721 metadata
    function initialize(string memory name_, string memory symbol_) public {
        LibERC721Storage.DiamondStorage storage ds = LibERC721Storage
            .diamondStorage();
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
        LibERC721Storage.DiamondStorage storage ds = LibERC721Storage
            .diamondStorage();
        require(
            owner != address(0),
            "ERC721: address zero is not a valid owner"
        );
        return ds._balances[owner];
    }

    /**
     * @dev See {IERC721-ownerOf}.
     */
    function ownerOf(uint256 tokenId) public view virtual returns (address) {
        LibERC721Storage.DiamondStorage storage ds = LibERC721Storage
            .diamondStorage();
        address owner = ds._owners[tokenId];
        require(
            owner != address(0),
            "ERC721: owner query for nonexistent token"
        );
        return owner;
    }

    /**
     * @dev See {IERC721Metadata-name}.
     */
    function name() public view virtual returns (string memory) {
        LibERC721Storage.DiamondStorage storage ds = LibERC721Storage
            .diamondStorage();
        return ds._name;
    }

    /**
     * @dev See {IERC721Metadata-symbol}.
     */
    function symbol() public view virtual returns (string memory) {
        LibERC721Storage.DiamondStorage storage ds = LibERC721Storage
            .diamondStorage();
        return ds._symbol;
    }

    /**
     * @dev See {IERC721Metadata-tokenURI}.
     */
    function tokenURI(uint256 tokenId)
        public
        view
        virtual
        returns (string memory)
    {
        require(
            _exists(tokenId),
            "ERC721Metadata: URI query for nonexistent token"
        );

        string memory baseURI = _baseURI();
        return
            bytes(baseURI).length > 0
                ? string(abi.encodePacked(baseURI, tokenId.toString()))
                : "";
    }

    /**
     * @dev Base URI for computing {tokenURI}. If set, the resulting URI for each
     * token will be the concatenation of the `baseURI` and the `tokenId`. Empty
     * by default, can be overridden in child contracts.
     */
    // TODO : edit for defo
    function _baseURI() internal view virtual returns (string memory) {
        return "";
    }

    /**
     * @dev See {IERC721-approve}.
     */
    function approve(address to, uint256 tokenId) public virtual {
        address owner = ERC721Facet.ownerOf(tokenId);
        require(to != owner, "ERC721: approval to current owner");

        require(
            LibMeta.msgSender() == owner ||
                isApprovedForAll(owner, LibMeta.msgSender()),
            "ERC721: approve caller is not owner nor approved for all"
        );

        _approve(to, tokenId);
    }

    /**
     * @dev See {IERC721-getApproved}.
     */
    function getApproved(uint256 tokenId)
        public
        view
        virtual
        returns (address)
    {
        LibERC721Storage.DiamondStorage storage ds = LibERC721Storage
            .diamondStorage();
        require(
            _exists(tokenId),
            "ERC721: approved query for nonexistent token"
        );

        return ds._tokenApprovals[tokenId];
    }

    /**
     * @dev See {IERC721-setApprovalForAll}.
     */
    function setApprovalForAll(address operator, bool approved) public virtual {
        _setApprovalForAll(LibMeta.msgSender(), operator, approved);
    }

    /**
     * @dev See {IERC721-isApprovedForAll}.
     */
    function isApprovedForAll(address owner, address operator)
        public
        view
        virtual
        returns (bool)
    {
        LibERC721Storage.DiamondStorage storage ds = LibERC721Storage
            .diamondStorage();
        return ds._operatorApprovals[owner][operator];
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
            _isApprovedOrOwner(LibMeta.msgSender(), tokenId),
            "ERC721: transfer caller is not owner nor approved"
        );

        _transfer(from, to, tokenId);
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
            _isApprovedOrOwner(LibMeta.msgSender(), tokenId),
            "ERC721: transfer caller is not owner nor approved"
        );
        LibERC721.checkOnERC721Received(sender, from, to, tokenId, _data);
        _transfer(from, to, tokenId);
    }

    /**
     * @dev Returns whether `tokenId` exists.
     *
     * Tokens can be managed by their owner or approved accounts via {approve} or {setApprovalForAll}.
     *
     * Tokens start existing when they are minted (`_mint`),
     * and stop existing when they are burned (`_burn`).
     */
    function _exists(uint256 tokenId) internal view virtual returns (bool) {
        LibERC721Storage.DiamondStorage storage ds = LibERC721Storage
            .diamondStorage();
        return ds._owners[tokenId] != address(0);
    }

    /**
     * @dev Returns whether `spender` is allowed to manage `tokenId`.
     *
     * Requirements:
     *
     * - `tokenId` must exist.
     */
    function _isApprovedOrOwner(address spender, uint256 tokenId)
        internal
        view
        virtual
        returns (bool)
    {
        require(
            _exists(tokenId),
            "ERC721: operator query for nonexistent token"
        );
        address owner = ERC721Facet.ownerOf(tokenId);
        return (spender == owner ||
            isApprovedForAll(owner, spender) ||
            getApproved(tokenId) == spender);
    }

    /**
     * @dev Safely mints `tokenId` and transfers it to `to`.
     *
     * Requirements:
     *
     * - `tokenId` must not exist.
     * - If `to` refers to a smart contract, it must implement {IERC721Receiver-onERC721Received}, which is called upon a safe transfer.
     *
     * Emits a {Transfer} event.
     */
    function _safeMint(address to, uint256 tokenId) internal virtual {
        _safeMint(to, tokenId, "");
    }

    /**
     * @dev Same as {xref-ERC721-_safeMint-address-uint256-}[`_safeMint`], with an additional `data` parameter which is
     * forwarded in {IERC721Receiver-onERC721Received} to contract recipients.
     */
    function _safeMint(
        address to,
        uint256 tokenId,
        bytes memory _data
    ) internal virtual {
        address sender = LibMeta.msgSender();
        _mint(to, tokenId);
        LibERC721.checkOnERC721Received(sender, address(0), to, tokenId, _data);
    }

    /**
     * @dev Mints `tokenId` and transfers it to `to`.
     *
     * WARNING: Usage of this method is discouraged, use {_safeMint} whenever possible
     *
     * Requirements:
     *
     * - `tokenId` must not exist.
     * - `to` cannot be the zero address.
     *
     * Emits a {Transfer} event.
     */
    function _mint(address to, uint256 tokenId) internal virtual {
        require(to != address(0), "ERC721: mint to the zero address");
        require(!_exists(tokenId), "ERC721: token already minted");
        LibERC721Storage.DiamondStorage storage ds = LibERC721Storage
            .diamondStorage();
        _beforeTokenTransfer(address(0), to, tokenId);

        ds._balances[to] += 1;
        ds._owners[tokenId] = to;

        emit LibERC721.Transfer(address(0), to, tokenId);

        _afterTokenTransfer(address(0), to, tokenId);
    }

    /**
     * @dev Destroys `tokenId`.
     * The approval is cleared when the token is burned.
     *
     * Requirements:
     *
     * - `tokenId` must exist.
     *
     * Emits a {Transfer} event.
     */
    function _burn(uint256 tokenId) internal virtual {
        address owner = ERC721Facet.ownerOf(tokenId);
        LibERC721Storage.DiamondStorage storage ds = LibERC721Storage
            .diamondStorage();
        _beforeTokenTransfer(owner, address(0), tokenId);

        // Clear approvals
        _approve(address(0), tokenId);

        ds._balances[owner] -= 1;
        delete ds._owners[tokenId];

        emit LibERC721.Transfer(owner, address(0), tokenId);

        _afterTokenTransfer(owner, address(0), tokenId);
    }

    /**
     * @dev Transfers `tokenId` from `from` to `to`.
     *  As opposed to {transferFrom}, this imposes no restrictions on msg.sender.
     *
     * Requirements:
     *
     * - `to` cannot be the zero address.
     * - `tokenId` token must be owned by `from`.
     *
     * Emits a {Transfer} event.
     */
    function _transfer(
        address from,
        address to,
        uint256 tokenId
    ) internal virtual {
        require(
            ERC721Facet.ownerOf(tokenId) == from,
            "ERC721: transfer from incorrect owner"
        );
        require(to != address(0), "ERC721: transfer to the zero address");
        LibERC721Storage.DiamondStorage storage ds = LibERC721Storage
            .diamondStorage();
        _beforeTokenTransfer(from, to, tokenId);

        // Clear approvals from the previous owner
        _approve(address(0), tokenId);

        ds._balances[from] -= 1;
        ds._balances[to] += 1;
        ds._owners[tokenId] = to;

        emit LibERC721.Transfer(from, to, tokenId);

        _afterTokenTransfer(from, to, tokenId);
    }

    /**
     * @dev Approve `to` to operate on `tokenId`
     *
     * Emits a {Approval} event.
     */
    function _approve(address to, uint256 tokenId) internal virtual {
        LibERC721Storage.DiamondStorage storage ds = LibERC721Storage
            .diamondStorage();
        ds._tokenApprovals[tokenId] = to;
        emit LibERC721.Approval(ERC721Facet.ownerOf(tokenId), to, tokenId);
    }

    /**
     * @dev Approve `operator` to operate on all of `owner` tokens
     *
     * Emits a {ApprovalForAll} event.
     */
    function _setApprovalForAll(
        address owner,
        address operator,
        bool approved
    ) internal virtual {
        require(owner != operator, "ERC721: approve to caller");
        LibERC721Storage.DiamondStorage storage ds = LibERC721Storage
            .diamondStorage();
        ds._operatorApprovals[owner][operator] = approved;
        emit LibERC721.ApprovalForAll(owner, operator, approved);
    }

    /**
     * @dev Hook that is called before any token transfer. This includes minting
     * and burning.
     *
     * Calling conditions:
     *
     * - When `from` and `to` are both non-zero, ``from``'s `tokenId` will be
     * transferred to `to`.
     * - When `from` is zero, `tokenId` will be minted for `to`.
     * - When `to` is zero, ``from``'s `tokenId` will be burned.
     * - `from` and `to` are never both zero.
     *
     * To learn more about hooks, head to xref:ROOT:extending-contracts.adoc#using-hooks[Using Hooks].
     */
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId
    ) internal virtual {}

    /**
     * @dev Hook that is called after any transfer of tokens. This includes
     * minting and burning.
     *
     * Calling conditions:
     *
     * - when `from` and `to` are both non-zero.
     * - `from` and `to` are never both zero.
     *
     * To learn more about hooks, head to xref:ROOT:extending-contracts.adoc#using-hooks[Using Hooks].
     */
    function _afterTokenTransfer(
        address from,
        address to,
        uint256 tokenId
    ) internal virtual {}
}
