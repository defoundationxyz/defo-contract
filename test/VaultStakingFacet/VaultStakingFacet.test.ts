import { DEFOToken } from "@contractTypes/contracts";
import assert from "assert";
import { expect } from "chai";
import newDebug from "debug";
import { Contract } from "ethers";
import { deployments, ethers, getNamedAccounts } from "hardhat";

const debug = newDebug("defo:DEFOToken.test.ts");

describe("DEFO Token", function () {
  let token: Contract;
  const tokenName = "DEFO Token";
  const tokenSymbol = "DEFO";
  const tokenDecimals = 18;
  const tokenSupply = 1e6;

  beforeEach(async function () {
    await deployments.fixture("DEFOToken");
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
