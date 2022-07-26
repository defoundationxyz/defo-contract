// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.9;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

uint256 constant PAYMENT_TOKENS = 2;
uint256 constant PAYMENT_RECEIVERS = 4;
uint256 constant WALLETS = 6;
uint256 constant TAX_TIERS = 4;

/// @dev token enum to index arrays of rates and addresses
    enum PaymentTokens {
        Defo,
        Dai
    }

/// @dev protocol wallets for easy enumeration, the order is extremely important once deployed, see configuration scripts
    enum Wallets {
        Treasury,
        RewardPool,
        LiquidityPair,
        Team,
        Charity,
        RedeemContract
    }


/// @dev these tiers correspond to the configurable percentage from the diamond storage
    enum TaxTiers {
        TIER0_NO_PAYMENT,
        TIER1_HUGE_TAX,
        TIER2_MEDIUM_TAX,
        TIER3_SMALL_TAX,
        NO_TAX
    }

    /**
     * @notice Main Protocol Configuration structure
     * @param mintLock no mint for all gems, no minting if set
     * @param transferLock no transfer if set, including no minting
     * @param incomeDistributionOnMint distribution of the payment among tokens in percent rates, all values use percentage multiplier (see percent helper), here addresses are from the Addresses
     * @param maintenancePeriod a period in seconds for maintenance fee accrual, initially one month
     * @param rewardPeriod a period in seconds for generating yield gem rewards, initially one week
     * @param mintCountResetPeriod a period in seconds to wait until last mint to reset mint count for a gem type, initially 12 hrs.
     * @param taxScaleSinceLastClaimPeriod a period in seconds for a tax scale to work out, initially one week
     * @param taxRates tax rates in percent (with percent multiplier, see percent helper contract), initially 30%, 30%, 15%, 0
     * @param charityContributionRate charity rate (w multiplier as all percent values in the project), initially 5%
     * @param taperRate taper rate, initially 20%
     * @param mintLock no mint for all gems, no minting if set
     * @param transferLock no transfer if set
     */

    struct ProtocolConfig {
        IERC20[PAYMENT_TOKENS] paymentTokens;
        address payable[WALLETS] wallets;
        uint256[WALLETS][PAYMENT_TOKENS] incomeDistributionOnMint;
        // time periods
        uint32 maintenancePeriod;
        uint32 rewardPeriod;
        uint32 taxScaleSinceLastClaimPeriod;
        // taxes and contributions
        uint256[TAX_TIERS] taxRates;
        uint256 charityContributionRate;
        uint256 taperRate;
        // locks
        bool mintLock;
        bool transferLock;
    }

/**
 * @notice A struct containing configuration details for gemType
     * @param maintenanceFee Maintenance fee in Dai for the node type, amount in wei per month
     * @param rewardAmountDefo Reward in DEFO for the node type, amount in wei per week
     * @param price Price in DEFO and DAI (in wei), respectively, according to the PaymentTokens enum
     * @param taperRewardsThresholdDefo Taper threshold, in wei, decreasing rate every given amount of rewards in DEFO
     * @param maintenancePeriod Maintenance period, usually one month, no free period - it's getting accrued for one month and on the first day of the next month should be paid
     * @param mintLimit Daily mint limit for a node type
     * @param mintCountResetPeriod a period in seconds to wait until last mint to reset mint count for a gem type, initially 12 hrs.
     */
    struct GemTypeConfig {
        uint256 maintenanceFeeDai;
        uint256 rewardAmountDefo;
        uint256[PAYMENT_TOKENS] price;
        uint256 taperRewardsThresholdDefo;
        uint256 maintenancePeriod;
        uint8 mintLimit;
        uint32 mintCountResetPeriod;
    }


/** @title  IConfig EIP-2535 Diamond Facet
  * @author Decentralized Foundation Team
  * @notice The Yield Gem Configuration, setters and getters
*/
interface IConfig {

    function setConfig(ProtocolConfig calldata _config) external;

    function getConfig() external pure returns (ProtocolConfig memory);

    function setGemTypeConfig(GemTypeConfig calldata _gemTypeConfig) external;

    function getGemTypeConfig(uint8 _gemType) external view returns (GemTypeConfig memory);

}
