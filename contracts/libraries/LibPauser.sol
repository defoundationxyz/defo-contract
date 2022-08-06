// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.15;

import "./LibAppStorage.sol";

/**
*   @notice Pausable contract
*   @dev should start with  s.config.transferLock = false which is default
*/

library LibPauser {
    event Paused(address account);
    event Unpaused(address account);

    modifier whenNotPaused() {
        _requireNotPaused();
        _;
    }

    modifier whenPaused() {
        _requirePaused();
        _;
    }

    function _paused() internal view returns (bool) {
        AppStorage storage s = LibAppStorage.diamondStorage();
        return s.config.transferLock;
    }

    function _requireNotPaused() internal view {
        require(!_paused(), "Pausable: paused, transfer is locked");
    }

    function _requirePaused() internal view {
        require(_paused(), "Pausable: not paused");
    }

    function _pause() internal whenNotPaused {
        AppStorage storage s = LibAppStorage.diamondStorage();
        s.config.transferLock = true;
        emit Paused(msg.sender);
    }

    function _unpause() internal whenPaused {
        AppStorage storage s = LibAppStorage.diamondStorage();
        s.config.transferLock = false;
        emit Unpaused(msg.sender);
    }


}
