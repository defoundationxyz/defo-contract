# DEFO smart contracts

DEFO is a DeFi protocol on AVAX. If you buy a Yield Gem NFT with our DEFO token, you get DEFO rewards every week.

## Preparation

Copy `.env.example` to `.env`.

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

## Contracts

The contract is built as an EIP-2535 Diamond, implementing ERC-1155 functionality covering both DEFO Token and Yield Gem
NFTs.
In order to interact with the deployed contracts, see `contracts/interfaces`.

### Avalanche FUJI Addresses

| Contract                                       | Address                                        |
|------------------------------------------------|------------------------------------------------|
| DEFO Token ERC-20                              | **0xA9D3adb2B5c7d89c56d74584E98ABcea1E4e6a4D** |
| DEFO Protocol Main Contract ERC-721 compatible | **0xf0d26dD82f6beE798cB677ee17E5466d009193Eb** |

## Cash flow

```mermaid
graph TD;
   L((Liquidity Pair)) --Buy<br/>DEFO --> User(User)
   User -- Sell<br/>DAI --> L
   User -- Mint<br/>25% DAI --> L
   User -- Mint<br/>75% DAI --> T((Treasury))
   User -- Mint<br/>25% DEFO --> L
   User -- Mint<br/>75% DEFO --> R((Rewards Pool))
   R -- Claim<br/>DEFO Reward - charity - tax --> User
   R -- Claim<br/>DEFO charity --> C((Charity))
   R -- Claim<br/>DEFO tax --> R
   R -- Stake<br/>DEFO Amount - charity --> V((Vault))
   R -- Stake<br/>DEFO charity --> C
   V -- Unstake<br/>DEFO staked - vault tax --> R
```
