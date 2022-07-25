// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.9;

import {PAYMENT_TOKENS} from "./IConfig.sol";

/** @title  IConfig EIP-2535 Diamond Facet
  * @author Decentralized Foundation Team
  * @notice The Yield Gem Configuration, setters and getters
*/

/**
 * @notice A struct containing configuration details for gemType
     * @param maintenanceFee Maintenance fee in Dai for the node type, amount in wei per month
     * @param rewardAmountDefo Reward in DEFO for the node type, amount in wei per week
     * @param dailyMintLimit Daily mint limit for a node type
     * @param price Price in DEFO and DAI (in wei), respectively, according to the PaymentTokens enum
     * @param taperRewardsThresholdDefo Taper threshold, in wei, decreasing rate every given amount of rewards in DEFO
     * @param maintenancePeriod Maintenance period, usually one month, no free period - it's getting accrued for one month and on the first day of the next month should be paid
     */
    struct GemTypeConfig {
        uint256 maintenanceFeeDai;
        uint256 rewardAmountDefo;
        uint256[PAYMENT_TOKENS] price;
        uint256 taperRewardsThresholdDefo;
        uint256 maintenancePeriod;
        uint8 mintLimit;
        uint32 mintLimitPeriod;
    }

/**
 * @notice A struct containing current mutable status for gemType
     * @param mintCount counter incrementing by one on every mint, during mintCountResetPeriod; after mintCountResetPeriod with no mints, reset to 0
     * @param endOfMintLimitWindow a moment to reset the mintCount counter to zero, set the new endOfMintLimitWindow and start over
     */
    struct GemTypeMintWindow {
        uint256 mintCount;
        uint32 endOfMintLimitWindow;
    }


interface IGemType {

    function setGemTypeConfig(GemTypeConfig calldata _gemTypeConfig) external;

    function getGemTypeConfig(uint8 _gemType) external view returns (GemTypeConfig memory);

    function isMintAvailableForGem(uint8 _gemType) external view returns (bool);

    function getMintWindow(uint8 _gemType) external view returns (GemTypeMintWindow memory);

}
