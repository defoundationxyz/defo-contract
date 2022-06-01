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

    function getExpiredTimeSinceLock(uint8 _gemType)
        external
        view
        returns (uint256)
    {
        LibGem.DiamondStorage storage ds = LibGem.diamondStorage();
        LibGem.GemTypeMetadata memory gemType = ds.GetGemTypeMetadata[_gemType];

        return block.timestamp - gemType.LastMint;
    }

    function isMintAvailableForGem(uint8 _gemType)
        external
        view
        returns (bool)
    {
        LibGem.DiamondStorage storage ds = LibGem.diamondStorage();
        LibGem.GemTypeMetadata memory gemType = ds.GetGemTypeMetadata[_gemType];
        LibMeta.DiamondStorage storage metads = LibMeta.diamondStorage();

        return
            (block.timestamp - gemType.LastMint >=
                1 hours * metads.MintLimitHours) ||
            (gemType.MintCount + 1 < gemType.DailyLimit);
    }
}
