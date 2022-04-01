//const { inputToConfig } = require("@ethereum-waffle/compiler");
const { expect } = require("chai");
const { ethers } = require("hardhat");
const { expectRevert } = require('@openzeppelin/test-helpers');

/* 
  -blocklist
  -buying tokens
    -need mock lp contracts
  -selling tokens
    -need mock router

*/  

describe("DefoLimiter", function () {
  let owner, acc1, acc2, acc3;
  let tokenAmount = 10000;
  let node, limiter, liqpool, router, defotoken;
  const DecimalMultiplier = ethers.BigNumber.from("10").pow("18")

  beforeEach(async function () {
    [owner, acc1, acc2, acc3, ...accs] = await ethers.getSigners();

    //Mock Node Deployment
    const Node = await ethers.getContractFactory("MockNode");
    node = await Node.deploy();
    await node.deployed();

    /// Check limiter constructor
    const Limiter = await ethers.getContractFactory("DefoLimiter");
    limiter = await Limiter.deploy(
      1, 
      acc2.address,
      node.address
      );
    await limiter.deployed();

    //Mock LP Deployment
    const LiqPool = await ethers.getContractFactory("MockLiqPool");
    liqpool = await LiqPool.deploy();
    await liqpool.deployed();
    
    //Mock Router Deployment
    const Router = await ethers.getContractFactory("MockRouter");
    router = await Router.deploy();
    await router.deployed();

    //Mock Defo Token Deployment
    const DefoToken = await ethers.getContractFactory("MockToken");
    defotoken = await DefoToken.connect(owner).deploy(limiter.address);
    await defotoken.deployed();

    //Set addresses in limiter contract
    await limiter.setTokenAddress(defotoken.address);
    await limiter.setLPAddress(defotoken.address); //Using defo token address so that minting acts as buying from a LP
    //await limiter.setLPManager(liqpool.address)
  });

  it("Should add an address to the blocklist and try to call from that address", async function() {
    await limiter.editBlocklist(acc1.address, true);
    expect(await limiter.Blocklist(acc1.address)).to.equal(true);

    await expectRevert(defotoken.connect(acc1).mint(acc1.address, tokenAmount), "Address is not permitted");
  })

  it("Should buy some tokens outside of timeframe", async function() {
    await defotoken.mint(owner.address, ethers.BigNumber.from("100000").mul(DecimalMultiplier)); //Mint all tokens to owner for total supply
    //If you change this address from `owner.address` to any other address it works, but I want the "LP" to be the person who has totalSupply
    await limiter.setLPAddress(acc1.address) //Set owner address as LP

    console.log("Owner balance before: ", await defotoken.balanceOf(owner.address))
    
    await defotoken.connect(owner).transfer(acc1.address, ethers.BigNumber.from("5").mul(DecimalMultiplier));
    await expectRevert(defotoken.connect(owner).transfer(acc1.address, ethers.BigNumber.from(500)), "Cannot buy anymore tokens during this timeframe");

    console.log("Owner Balance after: ", await defotoken.balanceOf(owner.address))
    console.log("ACC1 Balance: ", await defotoken.balanceOf(acc2.address))
  })

  // Implement BigNumber math so I can use expectRevert
  it("Should sell tokens from an account", async () => {
    await defotoken.mint(acc1.address, ethers.BigNumber.from("5000000000000000000"))
    await defotoken.connect(acc1).transfer(defotoken.address, "4");

    console.log("Balance of Tax Collector: ", await defotoken.balanceOf(acc2.address)) // Should be "2000000000000000000", which is (4 * (10 ** 18)) / 2
  })
});
