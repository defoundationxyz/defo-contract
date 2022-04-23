// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

/// @title Getter functions for various libraries
/// @author jvoljvolizka

interface IGettersFacet {
    function GemOf(uint256 _tokenId) external view;

    function GetGemTypeMetadata(uint8 _type) external view;
}