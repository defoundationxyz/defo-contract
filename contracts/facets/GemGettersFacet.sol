// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

/// @title Getter functions for various libraries
/// @author jvoljvolizka
import "../libraries/LibGem.sol";
import "../libraries/LibUser.sol";
import "../libraries/LibMeta.sol";

contract GemGettersFacet {
    function GemOf(uint256 _tokenId) external view returns (LibGem.Gem memory) {
        LibGem.DiamondStorage storage ds = LibGem.diamondStorage();
        LibGem.Gem storage gem = ds.GemOf[_tokenId];
        return gem;
    }

    function GetGemTypeMetadata(uint8 _type) external view returns (LibGem.GemTypeMetadata memory) {
        LibGem.DiamondStorage storage ds = LibGem.diamondStorage();
        LibGem.GemTypeMetadata storage gemTypeMetadata = ds.GetGemTypeMetadata[_type];
        return gemTypeMetadata;
    }

    function getUserTotalCharity(address _user) external view returns (uint256) {
        LibUser.DiamondStorage storage ds = LibUser.diamondStorage();
        LibUser.UserData storage user = ds.GetUserData[_user];
        return user.charityContribution;
    }

    function getMeta() external pure returns (LibMeta.DiamondStorage memory) {
        LibMeta.DiamondStorage storage ds = LibMeta.diamondStorage();
        return ds;
    }

    function getTotalCharity() external view returns (uint256) {
        LibMeta.DiamondStorage storage ds = LibMeta.diamondStorage();
        return ds.TotalCharity;
    }

    function getExpiredTimeSinceLock(uint8 _gemType) external view returns (uint256) {
        LibGem.DiamondStorage storage ds = LibGem.diamondStorage();
        LibGem.GemTypeMetadata memory gemType = ds.GetGemTypeMetadata[_gemType];

        return block.timestamp - gemType.LastMint;
    }
    ///TODO return false for unexisting gems
    function isMintAvailableForGem(uint8 _gemType) external view returns (bool) {
        LibGem.DiamondStorage storage ds = LibGem.diamondStorage();
        LibGem.GemTypeMetadata memory gemType = ds.GetGemTypeMetadata[_gemType];
        LibMeta.DiamondStorage storage metads = LibMeta.diamondStorage();
        return
            block.timestamp - gemType.LastMint >= metads.MintLimitPeriod || gemType.MintCount + 1 < gemType.DailyLimit;
    }

    ///checks if the a gem
    function getAvailableBoosters(
        LibGem.Booster _booster,
        uint8 _type,
        address _user
    ) public view returns (uint256) {
        LibUser.DiamondStorage storage ds = LibUser.diamondStorage();
        LibUser.UserData storage user = ds.GetUserData[_user];
        if (_booster == LibGem.Booster.Omega) {
            return user.OmegaClaims[_type];
        } else if (_booster == LibGem.Booster.Delta) {
            return user.DeltaClaims[_type];
        } else return 0;
    }
}
