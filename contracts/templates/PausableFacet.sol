// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.9;

import {FacetReady} from "../storage/StorageAndModifiers.sol";

/**
*   @notice Pausable contract
*   @dev should start with s.pause = false which is default
*/
contract PausableFacet is FacetReady {
    event Paused(address account);
    event Unpaused(address account);

    function _pause() internal whenNotPaused {
        s.paused = true;
        emit Paused(_msgSender());
    }

    function _unpause() internal whenPaused {
        s.paused = false;
        emit Unpaused(_msgSender());
    }
}
