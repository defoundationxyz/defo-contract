# DEFO smart contracts

DEFO is a DeFi protocol on AVAX. If you buy a Yield Gem NFT with our DEFO token, you get DEFO rewards every week.

## Preparation

Copy `.env-example` to `.env`.

```sh
$ yarn install
```

## Testing

To run unit & integration tests:

```sh
$ yarn test
```

To run coverage:

```sh
$ yarn coverage
```

## Deployment

We use [Hardhat](https://hardhat.dev) and [hardhat-deploy](https://github.com/wighawag/hardhat-deploy).
In one terminal window build the contracts, start a HH EVM fork of Avalanche mainnet, and deploy with:

```shell
yarn start-fork
```

In the other terminal window run the permit, mint, and wait a year script

```shell
yarn dev
```

## Handy scripts

To use those you need to have a local network running and contracts deployed, e.g. with `yarn start-fork`

```shell
yarn accounts       # AVAX, DAI, DEFO balances of all the named accounts
yarn gems           # balances of the NFTs for the deployer
yarn get-some-dai   # optional with account and amount, e.g. --account all --amount 10000
yarn get-some-defo  # same
yarn get-some-gems  # mints all 3 gems, optional with gem type (0,1,2), e.g. --type 0
yarn jump-in-time   # optional with human-readable time without spaces, e.g. --time 7d
yarn claim          # claim all claimable gems rewards, optional with gem id --id
yarn vault          # showing vault stats without changes, puts to vault with params --id --amount
```

## Contracts diagram
```mermaid
classDiagram
%% + public, + external, -internal, #private, ~modifier
%% * view, $ storage

class GemFacet {
  +getTaxTier(tokenId)
  +wenNextTaxTier(timeFromLastRewardWithdrawal)
  +RedeemMint(type, to) ~onlyMinter()
  +RedeemMintBooster(type, booster, to) ~onlyMinter()
  +BoostGem(booster, tokenId) ~onlyGemOwner() ~onlyActive()
  +getBoosters(booster, tokenId) (int,int)
  +MintGem(type) ~SaleLock ~mintLimit(type)
  +ClaimRewards(_tokenId) ~onlyClaimable ~onlyGemOwner()
  +Maintenance(_tokenId, _time) ~onlyGemOwner()
  +BatchMaintenance(_tokenIds[])
  +BatchClaimRewards(_tokenIds[])
  +BatchClaimRewards(_tokenIds[])
  +Compound(tokenId, gemType) ~onlyGemOwner() ~onlyActive()
  +Compound(tokenId, gemType) ~onlyGemOwner() ~onlyActive()
  +isActive(tokenId)* bool
  +isClaimable(tokenId)* bool
  +checkRawReward(tokenId)* uint
  +checkTaperedReward(tokenId)* uint
  +checkTaxedReward(tokenId)* uint
  +checkPendingMaintenance(tokenId)* uint
  +getGemIdsOf(tokenId)* uint[]
  +getGemIdsOfWithType(user, tokenId)* uint[]
  +getUserRewardEarned(user, tokenId)* uint[]
  +getTotalRewardEarned(user, tokenId)* uint[]
  -_distributePayment(amount, isDefo)
  -_mintGem(type, to) uint
  -_sendRewardTokens(tokenId, offset) uint
  -_compound(tokenId, gemType) uint ~mintLimit(gemType)
  -_maintenance(tokenId, time)
}
GemFacet --> LibMeta: Composition


class LibMeta {
  -msgSender() address
  -getChainID() uint
}
LibMeta --|> DiamondStorage
class DiamondStorage {
  -MaintenancePeriod uint
  -TreasuryDefoRate uint
  -TreasuryDaiRate uint
  -CharityRate uint
  -RewardPoolDefoRate uint
  -TeamDaiRate uint
  -LiquidityDefoRate uint
  -LiquidityDaiRate uint
  -_tokenIdCounter Counters.Counter
  -PaymentToken IERC20Joe
  -DefoToken IERC20Joe
  -RewardTaxTable uint[]
  -MinReward uint
  -RewardTime uint
  -MintLimitPeriod
  -Treasury address
  -RewardPool address
  -LimiterAddr address
  -Team address
  -Donation address
  -Vault address
  -Liquidity address
  -MaxGems uint
  -Lock bool
  -transferLock bool
  -TotalCharity uint
}



class OwnerFacet {
  +initialize(_redeemContract, _defoToken, _paymentToken, _treasury, _limiter, _rewardPool, _donation) ~onlyOnwer()
  +setGemSettings(type, gemData) ~onlyOwner()
  +setAddressAndDistTeam(newAddress, daiRate, DefoRate) ~onlyOwner()
  +setOther~Params~
}


GemFacet --* DEFODiamond
ERC721Facet --* DEFODiamond
ERC721EnumerableFacet --* DEFODiamond
VaultStakingFacet --* DEFODiamond
GemGettersFacet --* DEFODiamond
OwnerFacet --* DEFODiamond
NodeLimiterFacet --* DEFODiamond
```
