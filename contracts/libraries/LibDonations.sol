// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.15;

import "./LibAppStorage.sol";
import "hardhat/console.sol";

// helper for limit daily mints
library LibDonations {
    event Donated(address indexed user, uint256 amount);
}
