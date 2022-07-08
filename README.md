# DEFO smart contracts
DEFO is a DeFi protocol on AVAX. If you buy a Yield Gem NFT with our DEFO token, you get DEFO rewards every week.

## Using the repo
Copy `.env-example` to `.env`.

In one terminal window buils the contracts and start a HH EVM fork of Avalanche mainnet with:
```shell
yarn compile
yarn start-fork
```

In the other terminal window run the deployment and test scripts
```shell
yarn run-fork
```
