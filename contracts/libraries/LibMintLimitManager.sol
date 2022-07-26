// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.9;

import "./LibAppStorage.sol";
import "../interfaces/IGemType.sol";

// helper for limit daily mints
library LibMintLimitManager {
    /**
    *   @notice checks if a gem is mintable
    *   @param _gemType type of a gem, initially it's 0,1,2 for sapphire, ruby, and diamond, respectively
    *   @return true if mint is available, no revert
    *   @dev checks mintLock config and daily mintcount limit
    */
    function _isMintAvailableForGem(uint8 _gemType) internal view returns (bool) {
        AppStorage storage s = LibAppStorage.diamondStorage();
        GemTypeConfig memory gemType = s.getGemTypeConfig[_gemType];
        GemTypeMintWindow memory gemTypeMintWindow = s.GemTypeMintWindow[_gemType];
        return !(s.config.mintLock) &&
        ((GemTypeMintWindow.mintCount < gemType.DailyLimit) &&
        (block.timestamp <= endOfMintLimitWindow) ||
        (block.timestamp > endOfMintLimitWindow));
    }
}
