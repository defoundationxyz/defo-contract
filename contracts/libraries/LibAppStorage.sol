// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.9;

import {LibDiamond} from "hardhat-deploy/solc_0.8/diamond/libraries/LibDiamond.sol";
import {Gem} from "../interfaces/IYieldGem.sol";

    struct AppStorage {
        mapping(address => Gem) gems;
    }

library LibAppStorage {
    function diamondStorage() internal pure returns (AppStorage storage ds) {
        assembly {
            ds.slot := 0
        }
    }
}

contract Modifiers {
    AppStorage internal s;

    modifier onlyOwner() {
        LibDiamond.enforceIsContractOwner();
        _;
    }
}
