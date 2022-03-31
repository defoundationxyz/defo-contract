//const { inputToConfig } = require("@ethereum-waffle/compiler");
const { expect } = require("chai");
const { ethers } = require("hardhat");

/* 
  -blocklist
  -unauthorized destination
  -buying tokens
    -need mock lp contracts
  -selling tokens
    -need mock router

*/  

describe("DefoLimiter", function () {
  let owner, acc1, acc2, acc3;
  let tokenAmount = 10000;

  beforeEach(async function () {
    const [owner, acc1, acc2, acc3, ...accs] = await ethers.getSigners();

    const Node = await ethers.getContractFactory("MockNode")
    const node = await Node.deploy()
    await node.deployed()

    /// Check limiter constructor
    const Limiter = await ethers.getContractFactory("DefoLimiter");
    const limiter = await Limiter.deploy(
      1, 
      acc2.address,
      node.address
      );
    await limiter.deployed();

    const LiqPool = await ethers.getContractFactory("MockLiqPool")
    const liqpool = await LiqPool.deploy()
    await liqpool.deployed()
    
    const Router = await ethers.getContractFactory("MockRouter")
    const router = await Router.deploy()
    await router.deployed()

    const DefoToken = await ethers.getContractFactory("MockToken")
    const defotoken = await DefoToken.connect(owner).deploy(limiter.address)
    await defotoken.deployed()

    await limiter.setTokenAddress(defotoken.address)
  });

  it("Should add an address to the blocklist and try to call from that address", async function() {
    
    //await defotoken.mint(owner.address, 1);
    // await limiter.editBlocklist(acc1.address, false)
    // expect(await limiter.Blocklist(acc1.address)).to.equal(false)

    // await defotoken.transfer(acc1.address, tokenAmount)
  })
});
