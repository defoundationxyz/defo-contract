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
import "../libraries/LibERC721Enumerable.sol";

/**
 * @dev This implements an optional extension of {ERC721} defined in the EIP that adds
 * enumerability of all the token ids in the contract as well as all token ids owned by each
 * account.
 */
contract ERC721EnumerableFacet {
    function initializeERC721Enumerable(address erc721) public {
        LibDiamond.DiamondStorage storage dsMain = LibDiamond.diamondStorage();
        dsMain.supportedInterfaces[type(IERC721Enumerable).interfaceId] = true; //erc721-enumerable

        LibERC721Enumerable.DiamondStorage storage ds = LibERC721Enumerable
            .diamondStorage();
        require(!ds.init, "already initialized");
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
        return LibERC721Enumerable._tokenOfOwnerByIndex(owner, index);
    }

    /**
     * @dev See {IERC721Enumerable-totalSupply}.
     */
    function totalSupply() public view virtual returns (uint256) {
        LibERC721Enumerable.DiamondStorage storage ds = LibERC721Enumerable
            .diamondStorage();
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
        LibERC721Enumerable.DiamondStorage storage ds = LibERC721Enumerable
            .diamondStorage();
        return ds._allTokens[index];
    }
}
