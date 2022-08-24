// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.15;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
/**
*   @dev The only source for all the data structures used in the protocol storage
*   @dev This includes general config, gem type config, and mutable data
*/

/// @dev number of payment tokens to enumerate the error, initially it's Defo and Dai,
/// @dev see PaymentTokens enum
uint256 constant PAYMENT_TOKENS = 2;

/// @dev number of income recievers on yield gem mint
uint256 constant PAYMENT_RECEIVERS = 3;

/// @dev total wallets on the protocol, see Wallets enum
uint256 constant WALLETS = 7;

/// @dev total number of supported tax tiers
uint256 constant TAX_TIERS = 5;

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
        bool init;
    }


/// @notice token enum to index arrays of rates and addresses, the convention is that Dai is at place 0, Defo is at 1
/// @dev the order is extremely important once deployed
    enum PaymentTokens {
        Dai,
        Defo
    }

/// @notice protocol wallets for easy enumeration,
/// @dev the order is extremely important once deployed, see configuration scripts
    enum Wallets {
        Treasury,
        RewardPool,
        LiquidityPair,
        Team,
        Charity,
        Vault,
        RedeemContract
    }


/// @notice these tiers correspond to the configurable percentage from the diamond storage
    enum TaxTiers {
        Tier0NoPayment,
        Tier1HugeTax,
        Tier2MediumTax,
        Tier3SmallTax,
        Tier4NoTax
    }

/**
 * @notice DefoTokenLimitConfig DEFO ERC20 Token transfer limiter, this is for the 1000 DEFO per 24h sale limitation, can be changes with setTransferLimit
 * @param saleLimitPeriod initially 1 day
 * @param saleLimitAmount initially 1000 tokens
*/
    struct DefoTokenLimitConfig {
        uint256 saleLimitPeriod;
        uint256 saleLimitAmount;
        bool limitByReward;
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
     * @param vaultWithdrawalRate fee paid to withdraw amount from the vault back to the earned rewards, initially 10%
     * @param taperRate taper rate, initially 20%
     * @param mintLock no mint for all gems, no minting if set
     * @param transferLock no transfer if set
     * @param mintLimitWindow a period in seconds to wait until last mint to reset mint count for a gem type, initially 12 hrs, see GemTypeConfig.maxMintsPerLimitWindow
     */

    struct ProtocolConfig {
        IERC20[PAYMENT_TOKENS] paymentTokens;
        address[WALLETS] wallets;
        uint256[PAYMENT_RECEIVERS][PAYMENT_TOKENS] incomeDistributionOnMint;
        // time periods
        uint32 maintenancePeriod;
        uint32 rewardPeriod;
        uint32 taxScaleSinceLastClaimPeriod;
        // taxes and contributions
        uint256[TAX_TIERS] taxRates;
        uint256 charityContributionRate;
        uint256 vaultWithdrawalTaxRate;
        uint256 taperRate;
        // locks
        bool mintLock;
        bool transferLock;
        // mint limit period for coutner reset
        uint32 mintLimitWindow;
        DefoTokenLimitConfig defoTokenLimitConfig;
    }

/**
 * @notice A struct containing configuration details for gemType
     * @param maintenanceFee Maintenance fee in Dai for the node type, amount in wei per month
     * @param rewardAmountDefo Reward in DEFO for the node type, amount in wei per week
     * @param price Price in DEFO and DAI (in wei), respectively, according to the PaymentTokens enum
     * @param taperRewardsThresholdDefo Taper threshold, in wei, decreasing rate every given amount of rewards in DEFO
     * @param maxMintsPerLimitWindow number of gems, mint limit for a node type, see ProtocolConfig.mintLimitWindow
     */
    struct GemTypeConfig {
        uint256 maintenanceFeeDai;
        uint256 rewardAmountDefo;
        uint256[PAYMENT_TOKENS] price;
        uint256 taperRewardsThresholdDefo;
        uint8 maxMintsPerLimitWindow;
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

/**
 * @notice A struct describing current DEFO Token limiter input
 * @param tokensSold DEFO tokens sold per limit window, "sold" = "transferred to liquidity pair except the mint"
 * @param timeOfLastSale time of last sale
     */
    struct DEFOTokenLimitWindow {
        mapping(address => uint256) tokensSold;
        mapping(address => uint256) timeOfLastSale;
    }

    enum Booster {
        None,
        Delta,
        Omega
    }

/**
 * @notice A struct describing financial state, provides the complete state for user, gem, or protocol total.
 * @notice It gives the current exact balance of the Vault, Rewards, and Charity.
 * @param claimedGross rewards amount previously claimed for all time, gross amount - before tax and charity
 * @param claimedNet rewards claimed and to user, net amount after tax and charity
 * @param stakedGross amount removed from rewards to stake, charity not yet deducted
 * @param stakedNet amount put to the vault - charity has been deducted
 * @param unStakedGross  amount removed from the vault, pre withdraw tax and charity
 * @param unStakedGrossUpped  amount removed from the vault gross-upped with charity to equal to the stakedGross amount
 * @param unStakedNet  amount returned to the earned rewards, post withdraw tax and charity
 * @param donated sent to charity
 * @param claimTaxPaid claim tax deducted - 30%, 15%, 15%
 * @param vaultTaxPaid vault withdrawal tax deducted
     */
    struct Fi {
        uint256 claimedGross;
        uint256 claimedNet;
        uint256 stakedGross;
        uint256 stakedNet;
        uint256 unStakedGross;
        uint256 unStakedGrossUp;
        uint256 unStakedNet;
        uint256 donated;
        uint256 claimTaxPaid;
        uint256 vaultTaxPaid;
    }

/**
 * @notice current state of a gem, a gem is an instance with consistent yield and fee rates specified by the pair (gemType, booster)
 * @param gemType node type, initially it's  0 -> Ruby , 1 -> Sapphire, 2 -> Diamond, and boosters
 * @param booster node Booster 0 -> None , 1 -> Delta , 2 -> Omega
 * @param mintTime timestamp of the mint time
 * @param lastRewardWithdrawalTime timestamp of last reward claim OR stake. Same as mintTime if not yet claimed.
 * @param lastMaintenanceTime timestamp of the last maintenance (could be a date in the future in case of the upfront payment)
*/
    struct Gem {
        uint8 gemTypeId;
        Booster booster;
        uint32 mintTime;
        uint32 lastRewardWithdrawalTime;
        uint32 lastMaintenanceTime;
        Fi fi;
    }

/**
*   @notice Main Contract Storage utilizing App Storage pattern for Diamond Proxy data organization
*   @param config main configuration, basically everything except gemType specific
*   @param gemTypes supported gem types with their details, gemTypeId is the index of the array
*   @param gems mapping indexed by tokenId, where tokenId is in the nft.allTokens
*   @param gemTypesMintWindows windows for limiting yield gem mints per gem type
*   @param defoTokenLimitWindow window for limiting DEFO Token sale
*   @param nft ERC721 standard related storage
*   @param total cumulated amounts for all operations
*   @param usersFi financial info per each user
*/
    struct AppStorage {
        // configuration
        ProtocolConfig config;
        GemTypeConfig[] gemTypes;
        // current state
        GemTypeMintWindow[] gemTypesMintWindows;
        DEFOTokenLimitWindow defoTokenLimitWindow;
        mapping(uint256 => Gem) gems;
        ERC721Storage nft;
        // Cumulations
        Fi total;
        // User data, users list is s.nft.owners, size s.nft.allTokens.length (managed by ERC721Enumerable)
        mapping(address => Fi) usersFi;
        mapping(address => uint8) usersNextGemTypeToBoost;
        mapping(address => Booster) usersNextGemBooster;
    }
