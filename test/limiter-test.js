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
  var owner, acc1, acc2, acc3;
  var node, limiter, liqpool, router, defotoken;

  beforeEach(async function () {
    [owner, acc1, acc2, acc3, ...accs] = await ethers.getSigners();

    //Mock Node Deployment
    var Node = await ethers.getContractFactory("MockNode");
    node = await Node.deploy();
    await node.deployed();

    /// Check limiter constructor
    var Limiter = await ethers.getContractFactory("DefoLimiter");
    limiter = await Limiter.deploy(
      acc2.address,
      node.address
      );
    await limiter.deployed();

    //Mock LP Deployment
    var LiqPool = await ethers.getContractFactory("MockLiqPool");
    liqpool = await LiqPool.deploy();
    await liqpool.deployed();
    
    //Mock Router Deployment
    var Router = await ethers.getContractFactory("MockRouter");
    router = await Router.deploy();
    await router.deployed();

    //Mock Defo Token Deployment
    var DefoToken = await ethers.getContractFactory("MockToken");
    defotoken = await DefoToken.connect(owner).deploy(limiter.address);
    await defotoken.deployed();
    await defotoken.allowance(owner.address, limiter.address);

    //Set addresses in limiter contract
    await limiter.setTokenAddress(defotoken.address);
    await limiter.setLPAddress(defotoken.address); //Using defo token address so that minting acts as buying from a LP
    await defotoken.allowance(owner.address, limiter.address);
  });

  it("Should add an address to the blocklist and try to call from that address", async function() {
    await limiter.editBlocklist(acc1.address, true);
    expect(await limiter.Blocklist(acc1.address)).to.equal(true);

    await expectRevert(defotoken.connect(acc1).mint(acc1.address, "10000"), "Address is not permitted");
  })

  it("Should buy some tokens outside of timeframe", async function() {
    await defotoken.mint(owner.address, "200000"); //Mint all tokens to owner for total supply
    await limiter.setLPAddress(owner.address) //Set owner address as LP

    console.log("Owner balance before: ", await defotoken.balanceOf(owner.address))
    console.log("Current expiration timeframe: ", await limiter.timeframeExpiration())
    
    await defotoken.connect(owner).transfer(acc1.address, "1");
    //await expectRevert(defotoken.connect(owner).transfer(acc1.address, "100000"), "Cannot buy anymore tokens during this timeframe");
    //await defotoken.connect(owner).transfer(acc1.address, "2");
    await network.provider.send("evm_increaseTime", [43200])
    await ethers.provider.send('evm_mine');

    console.log("Owner Balance after: ", await defotoken.balanceOf(owner.address))
    console.log("ACC1 Balance: ", await defotoken.balanceOf(acc2.address))
  })

  // Implement BigNumber math so I can use expectRevert
  it("Should sell tokens from an account", async () => {
    await defotoken.mint(acc1.address, "5000000000000000000")
    await defotoken.connect(acc1).transfer(defotoken.address, "4");

    expect (await defotoken.balanceOf(acc2.address)).to.equal("2000000000000000000")
  })
});
