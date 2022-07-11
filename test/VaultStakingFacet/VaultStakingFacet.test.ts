import { DEFOToken } from "@contractTypes/contracts";
import { VaultStakingFacet } from "@contractTypes/contracts/facets";
import assert from "assert";
import { expect } from "chai";
import newDebug from "debug";
import { Contract } from "ethers";
import { deployments, ethers, getNamedAccounts } from "hardhat";

const debug = newDebug("defo:DEFOToken.test.ts");

describe("Vault Tests", function () {
  let vault: VaultStakingFacet;

  beforeEach(async function () {
    await deployments.fixture("DiamondConfigured");
    vault = await ethers.getContract();
  });
  describe("get public variables", () => {
    it("getting correct name", async function () {
      const defo = await ethers.getContract<DEFOToken>("DEFOToken");
      assert.equal(await defo.name(), tokenName);
      assert.equal(await defo.symbol(), tokenSymbol);
      assert.equal(await defo.decimals(), tokenDecimals);
      assert.equal(await defo.totalSupply(), tokenSupply);
    });
  });
});
