// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

/// @title Getter functions for various libraries
/// @author jvoljvolizka
import "../libraries/LibGem.sol";
import "../libraries/LibUser.sol";
import "../libraries/LibMeta.sol";

contract Getters {
    function GemOf(uint256 _tokenId) external view returns (LibGem.Gem memory) {
        LibGem.DiamondStorage storage ds = LibGem.diamondStorage();
        LibGem.Gem storage gem = ds.GemOf[_tokenId];
        return gem;
    }

    function GetGemTypeMetadata(uint8 _type)
        external
        view
        returns (LibGem.GemTypeMetadata memory)
    {
        LibGem.DiamondStorage storage ds = LibGem.diamondStorage();
        LibGem.GemTypeMetadata storage gemTypeMetadata = ds.GetGemTypeMetadata[
            _type
        ];
        return gemTypeMetadata;
    }
}
