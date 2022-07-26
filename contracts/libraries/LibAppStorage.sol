// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.9;

import {LibDiamond} from "hardhat-deploy/solc_0.8/diamond/libraries/LibDiamond.sol";
import {Gem, GemTypeMintWindow} from "../interfaces/IYieldGem.sol";
import {ProtocolConfig, GemTypeConfig} from "../interfaces/IConfig.sol";
import {ILimiter} from "../interfaces/ILimiter.sol";

/**
*   @notice a struct for data compliance with erc721 standard
*   @param name Token name
*   @param symbol Token symbol
*   @param owners Mapping from token ID to owner address
*   @param balances Mapping owner address to token count
*   @param tokenApprovals Mapping from token ID to approved address
*   @param operatorApprovals Mapping from owner to operator approvals
*   @param ownedTokens Mapping from owner to list of owned token IDs
*   @param ownedTokensIndex Mapping from token ID to index of the owner tokens list
*   @param allTokens Array with all token ids, used for enumeration
*   @param allTokensIndex Mapping from token id to position in the allTokens array
*/
    struct ERC721Storage {
        string name;
        string symbol;
        Counters.Counter tokenIdTracker;
        mapping(uint256 => address) owners;
        mapping(address => uint256) balances;
        mapping(uint256 => address) tokenApprovals;
        mapping(address => mapping(address => bool)) operatorApprovals;
        string baseURI;
        mapping(address => mapping(uint256 => uint256)) ownedTokens;
        mapping(uint256 => uint256) ownedTokensIndex;
        uint256[] allTokens;
        mapping(uint256 => uint256) allTokensIndex;
        ILimiter limiter;
        bool init;
    }

/**
*   @notice Main Contract Storage utilizing App Storage for Diamonds
*   @param config main configuration, basically everything except gemType specific
*   @param gems mapping indexed by tokenId
*/
    struct AppStorage {
        ProtocolConfig config;
        GemTypeConfig[] gemTypesConfig;
        GemTypeMintWindow[] gemTypesMintWindows;
        mapping(uint256 => Gem) gems;
        ERC721Storage nft;
    }

library LibAppStorage {
    function diamondStorage() internal pure returns (AppStorage storage ds) {
        assembly {
            ds.slot := 0
        }
    }
}
