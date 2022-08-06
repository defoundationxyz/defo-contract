// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.15;

import "./LibAppStorage.sol";
import "hardhat/console.sol";

// helper for limit daily mints
library LibMintLimiter {
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
        console.log("=== isMintAvailableForGem");
        console.log("s.config.mintLock ", s.config.mintLock);
        console.log("gemTypeMintWindow.mintCount ", gemTypeMintWindow.mintCount);
        console.log("gemType.maxMintsPerLimitWindow ", gemType.maxMintsPerLimitWindow);
        console.log("gemTypeMintWindow.endOfMintLimitWindow ", gemTypeMintWindow.endOfMintLimitWindow);
        console.log("block.timestamp ", block.timestamp);

        return !(s.config.mintLock) &&
        //checking if the limit in the current mint window has not been reached yet
        (((gemTypeMintWindow.mintCount < gemType.maxMintsPerLimitWindow) &&
        (block.timestamp <= gemTypeMintWindow.endOfMintLimitWindow)) ||
        //or we're already in another window ahead
        (block.timestamp > gemTypeMintWindow.endOfMintLimitWindow));
    }

    function updateMintCount(uint8 _gemTypeId) internal {
        AppStorage storage s = LibAppStorage.diamondStorage();
        if (block.timestamp > s.gemTypesMintWindows[_gemTypeId].endOfMintLimitWindow) {
            //setting up new mint window
            do {
                s.gemTypesMintWindows[_gemTypeId].endOfMintLimitWindow += s.config.mintLimitWindow;
            }
            while (block.timestamp > s.gemTypesMintWindows[_gemTypeId].endOfMintLimitWindow);
            s.gemTypesMintWindows[_gemTypeId].mintCount = 1;
        }
        else {
            //current window
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
