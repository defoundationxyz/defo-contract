// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.15;

import "./LibAppStorage.sol";

// helper for limit daily mints
library LibMintLimitManager {
    event MintLocked();
    event MintUnlocked();

    /**
    *   @notice checks if a gem is mintable
    *   @param _gemTypeId type of a gem, initially it's 0,1,2 for sapphire, ruby, and diamond, respectively
    *   @return true if mint is available, no revert
    *   @dev checks mintLock config and daily mintcount limit
    */
    function isMintAvailableForGem(uint8 _gemTypeId) internal view returns (bool) {
        AppStorage storage s = LibAppStorage.diamondStorage();
        GemTypeConfig memory gemType = s.gemTypes[_gemTypeId];
        GemTypeMintWindow memory gemTypeMintWindow = s.gemTypesMintWindows[_gemTypeId];
        return !(s.config.mintLock) &&
        ((gemTypeMintWindow.mintCount < gemType.maxMintsPerLimitWindow) &&
        (block.timestamp <= gemTypeMintWindow.endOfMintLimitWindow) ||
        (block.timestamp > gemTypeMintWindow.endOfMintLimitWindow));
    }

    function updateMintCount(uint8 _gemTypeId) internal {
        AppStorage storage s = LibAppStorage.diamondStorage();
        if (block.timestamp > s.gemTypesMintWindows[_gemTypeId].endOfMintLimitWindow) {
            s.gemTypesMintWindows[_gemTypeId].endOfMintLimitWindow += s.config.mintLimitWindow;
            s.gemTypesMintWindows[_gemTypeId].mintCount = 1;
        }
        else {
            s.gemTypesMintWindows[_gemTypeId].mintCount++;
        }
    }


    function lockMint() internal {
        AppStorage storage s = LibAppStorage.diamondStorage();
        s.config.mintLock = true;
        emit MintLocked();
    }
    function unlockMint() internal {
        AppStorage storage s = LibAppStorage.diamondStorage();
        s.config.mintLock = false;
        emit MintUnlocked();
    }


}
