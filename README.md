# DEFO smart contracts
DEFO is a DeFi protocol on AVAX. If you buy a Yield Gem NFT with our DEFO token, you get DEFO rewards every week.

## Running the contracts
Copy `.env-example` to `.env`.

In one terminal window buils the contracts and start a HH EVM fork of Avalanche mainnet with:
```shell
yarn start-fork
```

In the other terminal window run the deployment and test scripts
```shell
yarn run-fork
```

## Handy scripts
```shell
yarn accounts       # AVAX, DAI, DEFO balances of all the named accounts
yarn gems           # balances of the NFTs for the deployer
yarn get-some-dai   # optional with named account (or all) and amount --account all --amount 10000
yarn get-some-defo  # same
yarn get-some-gems  # mints all 3 gems, optional with --gemType 2
yarn jump-in-time   # optional with human-readable time without spaces --time 16d
```
