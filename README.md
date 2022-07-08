# DEFO smart contracts
DEFO is a DeFi protocol on AVAX. If you buy a Yield Gem NFT with our DEFO token, you get DEFO rewards every week.

## Using the repo
Be sure you create `.env` file (see `.env-example`).

In one terminal window start a HH EVM fork of Avalanche mainnet with:
```shell
yarn start-fork
```

In the other terminal window run the deployment and test scripts
```shell
yarn run-fork
```
