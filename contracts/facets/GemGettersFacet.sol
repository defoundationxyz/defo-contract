// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

/// @title Getter functions for various libraries
/// @author jvoljvolizka
import "../libraries/LibGem.sol";
import "../libraries/LibUser.sol";
import "../libraries/LibMeta.sol";

contract GettersFacet {
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

    function getTotalCharity(address _user) external view returns (uint256) {
        LibUser.DiamondStorage storage ds = LibUser.diamondStorage();
        LibUser.UserData storage user = ds.GetUserData[_user];
        return user.charityContribution;
    }

    function getMeta() external view returns (LibMeta.DiamondStorage memory) {
        LibMeta.DiamondStorage storage ds = LibMeta.diamondStorage();
        return ds;
    }
}
