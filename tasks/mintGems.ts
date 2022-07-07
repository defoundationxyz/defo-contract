import { task, types } from "hardhat/config";

import { GEM_TYPES } from "../constants";
import { GemFacet } from "../types";
import { error, info } from "../utils/helpers";

export default task("mint-some-gems", "mint all NFTs")
  .addOptionalParam(
    "account",
    "The account name to get defo, e.g. 'treasury', 'vault', or 'all'",
    "deployer",
    types.string,
  )
  .addOptionalParam("gemType", "0 - sapphire, 1 - ruby, 2 - diamond", -1, types.int)
  .setAction(async ({ account, gemType }, hre) => {
    const { getNamedAccounts, deployments, ethers } = hre;
    const namedAccounts = await getNamedAccounts();
    if (account !== "all" && !namedAccounts[account]) {
      error(`Named account ${account} not set`);
      return;
    }
    /// TODO  VM Exception while processing transaction: reverted with reason string 'Defo/insufficient-allowance'
    /// modify Solidity code to catch the error
    const diamondDeployment = await deployments.get("DEFODiamond");
    const gemFacetContract = await ethers.getContractAt<GemFacet>("GemFacet", diamondDeployment.address);
    const types: number[] = gemType === -1 ? Object.values(GEM_TYPES) : [gemType];
    for (const type of types) {
      info(`Minting gem ${type}`);
      await gemFacetContract.MintGem(type);
    }
  });
