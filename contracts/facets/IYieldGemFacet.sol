// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.9;

import "../interfaces/IYieldGem.sol";
import "../nft-facet/ERC721MinterLimiterBurnableEnumerablePausableFacet.sol";

/** @title  ERC721Facet EIP-2535 Diamond Facet
  * @author Decentralized Foundation Team
  * @notice The Contract uses diamond storage providing functionality of ERC721, ERC721Enumerable, ERC721Burnable, ERC721Pausable
*/
contract YieldGemFacet is ERC721MinterLimiterBurnableEnumerablePausableFacet, IYieldGem {


    function mintGem(uint8 _gemType) external  mintLimit(_type){

    }

    function maintain(uint256 _tokenId) external;

    function batchMaintain(uint256[] calldata _tokenIds) external;

    function getGemDetails(uint256 _tokenId) external view returns (Gem memory);

    function getPendingMaintenance(uint256 _tokenId) external view returns (uint256);

}
