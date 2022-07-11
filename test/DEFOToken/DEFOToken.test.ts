import { DEFOToken } from "@contractTypes/contracts";
import { expect } from "chai";
import { deployments, ethers } from "hardhat";

//import newDebug from "debug";
///TODO Add transfer ownership and other tests, including security
//const debug = newDebug("defo:DEFOToken.test.ts");

describe("DEFO Token", async () => {
  const decimals = 18;
  const supply = 1e6;
  const name = "DEFO Token";
  const ticker = "DEFO";
  let defo: DEFOToken;

  beforeEach(async function () {
    await deployments.fixture("DEFOToken");
    defo = await ethers.getContract<DEFOToken>("DEFOToken");
  });

  describe("name and ticker", () => {
    it("getting token name", async function () {
      expect(await defo.name()).to.equal(name);
      expect(await defo.symbol()).to.equal(ticker);
    });
  });

  describe("decimals()", () => {
    it(`should return default decimals`, async () => {
      expect(await defo.decimals()).to.equal(decimals);
    });
  });

  describe("totalSupply()", () => {
    it("should return correct supply", async () => {
      expect((await defo.totalSupply()).eq(ethers.utils.parseEther(supply.toString()))).to.be.true;
    });
  });

  describe("owner()", () => {
    it("should return correct token owner", async () => {
      expect(await defo.owner()).to.equal(process.env.DEFO_TOKEN_PUBLIC_KEY);
    });
  });
});
