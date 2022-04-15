// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts v4.4.1 (token/ERC721/extensions/ERC721Enumerable.sol)
pragma solidity ^0.8.4;

/// @title ERC721 Enumerable standard facet with diamond storage pattern
/// @author jvoljvolizka

/**
 *   @dev This contract is openzeppelin ERC721-Enumerable implementation edited according to diamond storage pattern
 *   for information about facets and diamond storage please check EIP-2535
 */

import "../interfaces/IERC721Enumerable.sol";
import "../libraries/LibDiamond.sol";
import "../libraries/LibERC721EnumerableStorage.sol";

/**
 * @dev This implements an optional extension of {ERC721} defined in the EIP that adds
 * enumerability of all the token ids in the contract as well as all token ids owned by each
 * account.
 */
contract ERC721EnumerableFacet {
    function initializeERC721Enumerable(address erc721) public {
        LibDiamond.DiamondStorage storage dsMain = LibDiamond.diamondStorage();
        dsMain.supportedInterfaces[type(IERC721Enumerable).interfaceId] = true; //erc721-enumerable

        LibERC721EnumerableStorage.DiamondStorage
            storage ds = LibERC721EnumerableStorage.diamondStorage();
        ds.erc721 = IERC721(erc721); //erc721-enumerable
    }

    /**
     * @dev See {IERC721Enumerable-tokenOfOwnerByIndex}.
     */
    function tokenOfOwnerByIndex(address owner, uint256 index)
        public
        view
        virtual
        returns (uint256)
    {
        LibERC721EnumerableStorage.DiamondStorage
            storage ds = LibERC721EnumerableStorage.diamondStorage();
        require(
            index < ds.erc721.balanceOf(owner),
            "ERC721Enumerable: owner index out of bounds"
        );
        return ds._ownedTokens[owner][index];
    }

    /**
     * @dev See {IERC721Enumerable-totalSupply}.
     */
    function totalSupply() public view virtual returns (uint256) {
        LibERC721EnumerableStorage.DiamondStorage
            storage ds = LibERC721EnumerableStorage.diamondStorage();
        return ds._allTokens.length;
    }

    /**
     * @dev See {IERC721Enumerable-tokenByIndex}.
     */
    function tokenByIndex(uint256 index) public view virtual returns (uint256) {
        require(
            index < ERC721EnumerableFacet.totalSupply(),
            "ERC721Enumerable: global index out of bounds"
        );
        LibERC721EnumerableStorage.DiamondStorage
            storage ds = LibERC721EnumerableStorage.diamondStorage();
        return ds._allTokens[index];
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
     * - `from` cannot be the zero address.
     * - `to` cannot be the zero address.
     *
     * To learn more about hooks, head to xref:ROOT:extending-contracts.adoc#using-hooks[Using Hooks].
     */
    // TODO: check supers
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId
    ) internal virtual {
        LibERC721EnumerableStorage.DiamondStorage
            storage ds = LibERC721EnumerableStorage.diamondStorage();
        //super._beforeTokenTransfer(from, to, tokenId);

        if (from == address(0)) {
            _addTokenToAllTokensEnumeration(tokenId);
        } else if (from != to) {
            _removeTokenFromOwnerEnumeration(from, tokenId);
        }
        if (to == address(0)) {
            _removeTokenFromAllTokensEnumeration(tokenId);
        } else if (to != from) {
            _addTokenToOwnerEnumeration(to, tokenId);
        }
    }

    /**
     * @dev Private function to add a token to this extension's ownership-tracking data structures.
     * @param to address representing the new owner of the given token ID
     * @param tokenId uint256 ID of the token to be added to the tokens list of the given address
     */
    function _addTokenToOwnerEnumeration(address to, uint256 tokenId) private {
        LibERC721EnumerableStorage.DiamondStorage
            storage ds = LibERC721EnumerableStorage.diamondStorage();
        uint256 length = ds.erc721.balanceOf(to);
        ds._ownedTokens[to][length] = tokenId;
        ds._ownedTokensIndex[tokenId] = length;
    }

    /**
     * @dev Private function to add a token to this extension's token tracking data structures.
     * @param tokenId uint256 ID of the token to be added to the tokens list
     */
    function _addTokenToAllTokensEnumeration(uint256 tokenId) private {
        LibERC721EnumerableStorage.DiamondStorage
            storage ds = LibERC721EnumerableStorage.diamondStorage();
        ds._allTokensIndex[tokenId] = ds._allTokens.length;
        ds._allTokens.push(tokenId);
    }

    /**
     * @dev Private function to remove a token from this extension's ownership-tracking data structures. Note that
     * while the token is not assigned a new owner, the `_ownedTokensIndex` mapping is _not_ updated: this allows for
     * gas optimizations e.g. when performing a transfer operation (avoiding double writes).
     * This has O(1) time complexity, but alters the order of the _ownedTokens array.
     * @param from address representing the previous owner of the given token ID
     * @param tokenId uint256 ID of the token to be removed from the tokens list of the given address
     */
    function _removeTokenFromOwnerEnumeration(address from, uint256 tokenId)
        private
    {
        LibERC721EnumerableStorage.DiamondStorage
            storage ds = LibERC721EnumerableStorage.diamondStorage();
        // To prevent a gap in from's tokens array, we store the last token in the index of the token to delete, and
        // then delete the last slot (swap and pop).

        uint256 lastTokenIndex = ds.erc721.balanceOf(from) - 1;
        uint256 tokenIndex = ds._ownedTokensIndex[tokenId];

        // When the token to delete is the last token, the swap operation is unnecessary
        if (tokenIndex != lastTokenIndex) {
            uint256 lastTokenId = ds._ownedTokens[from][lastTokenIndex];

            ds._ownedTokens[from][tokenIndex] = lastTokenId; // Move the last token to the slot of the to-delete token
            ds._ownedTokensIndex[lastTokenId] = tokenIndex; // Update the moved token's index
        }

        // This also deletes the contents at the last position of the array
        delete ds._ownedTokensIndex[tokenId];
        delete ds._ownedTokens[from][lastTokenIndex];
    }

    /**
     * @dev Private function to remove a token from this extension's token tracking data structures.
     * This has O(1) time complexity, but alters the order of the _allTokens array.
     * @param tokenId uint256 ID of the token to be removed from the tokens list
     */
    function _removeTokenFromAllTokensEnumeration(uint256 tokenId) private {
        LibERC721EnumerableStorage.DiamondStorage
            storage ds = LibERC721EnumerableStorage.diamondStorage();
        // To prevent a gap in the tokens array, we store the last token in the index of the token to delete, and
        // then delete the last slot (swap and pop).

        uint256 lastTokenIndex = ds._allTokens.length - 1;
        uint256 tokenIndex = ds._allTokensIndex[tokenId];

        // When the token to delete is the last token, the swap operation is unnecessary. However, since this occurs so
        // rarely (when the last minted token is burnt) that we still do the swap here to avoid the gas cost of adding
        // an 'if' statement (like in _removeTokenFromOwnerEnumeration)
        uint256 lastTokenId = ds._allTokens[lastTokenIndex];

        ds._allTokens[tokenIndex] = lastTokenId; // Move the last token to the slot of the to-delete token
        ds._allTokensIndex[lastTokenId] = tokenIndex; // Update the moved token's index

        // This also deletes the contents at the last position of the array
        delete ds._allTokensIndex[tokenId];
        ds._allTokens.pop();
    }
}
