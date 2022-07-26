// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.9;

import {FacetReady} from "../storage/FacetReady.sol";

/**
*   @notice Pausable contract
*   @dev should start with s.pause = false which is default
*/
contract PausableFacet is FacetReady {
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

    function paused() public view virtual returns (bool) {
        return s.paused;
    }

    function _requireNotPaused() internal view virtual {
        require(!paused(), "Pausable: paused");
    }

    function _requirePaused() internal view virtual {
        require(paused(), "Pausable: not paused");
    }

    function _pause() internal whenNotPaused {
        s.paused = true;
        emit Paused(_msgSender());
    }

    function _unpause() internal whenPaused {
        s.paused = false;
        emit Unpaused(_msgSender());
    }



}
