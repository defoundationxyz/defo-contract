# DEFO smart contracts
DEFO is a DeFi protocol on AVAX. If you buy a Yield Gem NFT with our DEFO token, you get DEFO rewards every week.

## Preparation
Copy `.env-example` to `.env`.
```sh
$ yarn install
```

[//]: # ()
[//]: # (## Testing)

[//]: # ()
[//]: # (To run unit & integration tests:)

[//]: # ()
[//]: # (```sh)

[//]: # ($ yarn test)

[//]: # (```)

[//]: # ()
[//]: # (To run coverage:)

[//]: # ()
[//]: # (```sh)

[//]: # ($ yarn coverage)

[//]: # (```)

## Deployment
We use [Hardhat](https://hardhat.dev) and [hardhat-deploy](https://github.com/wighawag/hardhat-deploy).
In one terminal window build the contracts, start a HH EVM fork of Avalanche mainnet, and deploy with:
```shell
yarn start-fork
```

In the other terminal window run the permint, mint, and wait a year script
```shell
yarn dev
```

## Handy scripts
To use those you need to have a local network running and contracts deployed, e.g. with `yarn start-fork`
```shell
yarn accounts       # AVAX, DAI, DEFO balances of all the named accounts
yarn gems           # balances of the NFTs for the deployer
yarn get-some-dai   # optional with named account (or all) and amount --account all --amount 10000
yarn get-some-defo  # same
yarn get-some-gems  # mints all 3 gems, optional with --gemType 2
yarn jump-in-time   # optional with human-readable time without spaces --time 16d
```
