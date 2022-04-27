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
  var node, 
      limiter, 
      liqpool, 
      lpmanager, 
      router, 
      defotoken, 
      mockdai, 
      mockpair, 
      mockfactory,
      mockgemhybridfacet, 
      wavax;

  beforeEach(async function () {
    [owner, acc1, acc2, acc3, ...accs] = await ethers.getSigners();

    await ethers.provider.send("hardhat_reset",[{
      forking: {
          jsonRpcUrl: "https://api.avax.network/ext/bc/C/rpc",
          blockNumber: 2975762,
        },
      },
      ],
    );

    //Mock Node Deployment
    var Node = await ethers.getContractFactory("MockNode");
    node = await Node.deploy();
    await node.deployed();

    //Mock Facet Deployjment
    var MockGemHybridFacet = await ethers.getContractFactory("MockGemHybridFacet")
    mockgemhybridfacet = await MockGemHybridFacet.deploy()
    await mockgemhybridfacet.deployed()

    /// Check limiter constructor
    var Limiter = await ethers.getContractFactory("DefoLimiter");
    limiter = await Limiter.deploy();
    await limiter.deployed();
    limiter.initialize(
      node.address,
      acc2.address,
      mockgemhybridfacet.address
    )

    //Mock LP Deployment
    var LiqPool = await ethers.getContractFactory("MockLiqPool");
    liqpool = await LiqPool.deploy();
    await liqpool.deployed();

    //Mock Defo Token Deployment
    var DefoToken = await ethers.getContractFactory("MockToken");
    defotoken = await DefoToken.connect(owner).deploy(limiter.address);
    await defotoken.deployed();
    await defotoken.allowance(owner.address, limiter.address);

    //Mock DAI Deployment
    var MockDAI = await ethers.getContractFactory("MockDAI");
    mockdai = await MockDAI.connect(owner).deploy();
    await mockdai.deployed();

    //WAVAX Deployment
    var WAVAX = await ethers.getContractFactory("WAVAX");
    wavax = await WAVAX.connect(owner).deploy(owner.address);
    await wavax.deployed();

    //Mock LP Factory Deployment
    var MockFactory = await ethers.getContractFactory("MockFactory");
    mockfactory = await MockFactory.connect(owner).deploy(owner.address);
    await mockfactory.deployed();

    //Mock LP Pair Deployment
    var MockPair = await ethers.getContractFactory("JoePair");
    mockpair = await MockPair.connect(owner).deploy();
    await mockpair.deployed();

    //Mock Router Deployment
    var Router = await ethers.getContractFactory("JoeRouter02");
    router = await Router.deploy(mockfactory.address, wavax.address);
    await router.deployed();

    //Mock LP Manager Deployment
    var LPManager = await ethers.getContractFactory("MockLPManager");
    lpmanager = await LPManager.connect(owner).deploy(
      router.address,
      [mockdai.address, defotoken.address]
    );
    await lpmanager.deployed();

    //Set addresses in limiter contract
    await limiter.setTokenAddress(defotoken.address);
    await limiter.setLPAddress(defotoken.address); //Using defo token address so that minting acts as buying from a LP
    await limiter.setLPManager(lpmanager.address);
    await defotoken.allowance(owner.address, limiter.address);
  });

  it("Should add an address to the blocklist and try to call from that address", async function() {
    await limiter.editBlocklist(acc1.address, true);
    expect(await limiter.Blocklist(acc1.address)).to.equal(true);

    await expectRevert(defotoken.connect(acc1).mint(acc1.address, "10000"), "Address is not permitted");
  })

  
  /*it("Should buy some tokens outside of timeframe", async function() {
    await defotoken.mint(owner.address, "200000"); //Mint all tokens to owner for total supply
    await limiter.setLPAddress(owner.address) //Set owner address as LP

    console.log("Owner balance before: ", await defotoken.balanceOf(owner.address))
    console.log("Current expiration timeframe: ", await limiter.timeframeExpiration())
    // console.log(await defotoken.connect(owner).transfer(acc1.address, "1", {
    //   gasPrice: 156470235
    // }));
    
    await defotoken.connect(owner).transfer(acc1.address, "1");
    await expectRevert(defotoken.connect(owner).transfer(acc1.address, "100000"), "Cannot buy anymore tokens during this timeframe");
    //await network.provider.send("evm_increaseTime", [43200]);
    //await ethers.provider.send('evm_mine');

    console.log("Owner Balance after: ", await defotoken.balanceOf(owner.address))
    console.log("ACC1 Balance: ", await defotoken.balanceOf(acc2.address))
  }) */

  it("Should sell tokens from an account", async () => {
    await defotoken.mint(acc1.address, "5000000000000000000")
    await defotoken.connect(acc1).transfer(defotoken.address, "4");

    await expectRevert(
      defotoken.connect(acc1).transfer(defotoken.address, "4"), 
      "Cannot sell more than amount of rewards per week"
    )
  })
});
