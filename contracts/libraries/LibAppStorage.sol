// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.9;

import "../data-types/IDataTypes.sol";

/** @title  LibAppStorage EIP-2535 Diamond Facet Storage
  * @author Decentralized Foundation Team
  * @notice This diamond storage library is inherited by all facets and imported in libraries
*/
library LibAppStorage {
    function diamondStorage() internal pure returns (AppStorage storage ds) {
        assembly {
            ds.slot := 0
        }
    }
}
