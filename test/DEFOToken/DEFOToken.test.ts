import assert from "assert";
import { expect } from "chai";
import { Contract } from "ethers";
import { deployments, ethers, getNamedAccounts } from "hardhat";

// let deployer;
// before(async () => {
//   const namedAccounts = await getNamedAccounts();
//   deployer = namedAccounts.deployer;
// });

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
      const defo = await ethers.getContract("DEFOToken");
      assert.equal(await defo.name(), tokenName);
    });
  });
});
