// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.15;

import "./B0Storage.sol";

/**
*   @notice Pausable contract
*   @dev should start with  s.config.transferLock = false which is default
*/
contract Pause is Storage {
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
        return s.config.transferLock;
    }

    function _requireNotPaused() internal view virtual {
        require(!_paused(), "Pausable: paused, transfer is locked");
    }

    function _requirePaused() internal view virtual {
        require(_paused(), "Pausable: not paused");
    }

    function _pause() internal whenNotPaused {
        s.config.transferLock = true;
        emit Paused(_msgSender());
    }

    function _unpause() internal whenPaused {
        s.config.transferLock = false;
        emit Unpaused(_msgSender());
    }


}
