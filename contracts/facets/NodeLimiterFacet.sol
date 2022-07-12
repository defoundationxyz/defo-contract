// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

/// @title Node Limiter Facet
/// @author jvoljvolizka

import "../libraries/LibDiamond.sol";
import "../libraries/LibNodeLimiter.sol";
import "../libraries/LibMeta.sol";

contract NodeLimiterFacet {
    modifier onlyOwner() {
        require(LibMeta.msgSender() == LibDiamond.contractOwner());
        _;
    }

    function addToWhitelist(address _newAddress) external onlyOwner {
        LibNodeLimiter.DiamondStorage storage ds = LibNodeLimiter.diamondStorage();
        ds.whitelist.push(_newAddress);
    }

    function transferLimit(
        address from,
        address to,
        uint256 tokenId
    ) public {
        LibNodeLimiter.DiamondStorage storage ds = LibNodeLimiter.diamondStorage();
        LibMeta.DiamondStorage storage metads = LibMeta.diamondStorage();
        if (metads.transferLock) {
            bool transferblock = true;
            for (uint256 index = 0; index < ds.whitelist.length; index++) {
                if (from == ds.whitelist[index] || to == ds.whitelist[index]) {
                    transferblock = false;
                    continue;
                }
            }
            require(!transferblock, "Transfer is forbidden");
        }
    }
}
