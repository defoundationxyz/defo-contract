const { expect } = require("chai");
const { ethers } = require("hardhat");
const { expectRevert } = require("@openzeppelin/test-helpers");

// check timer
// check state
// check address setter
// check redeem funcitonality
//      check balance of redeemer
//           both presale nft and node nft
//      checks should be tested on function call ssince they are modifiers

describe("RedeemFunctionality", function () {

  let owner;
  let acc1;
  let acc2;
  let acc3;
  let acc;

  beforeEach(async function () {
    MockDai = await ethers.getContractFactory("MockDAI");
    MockSapphire = await ethers.getContractFactory("MockSapphire");
    MockRuby = await ethers.getContractFactory("MockRuby");
    MockDiamond = await ethers.getContractFactory("MockDiamond");
    MockNode = await ethers.getContractFactory("MockNode");

    Redeem = await ethers.getContractFactory("Redeem");


    [owner, acc1, acc2, ...acc] = await ethers.getSigners();

    mockdai = await MockDai.deploy();
    await mockdai.deployed();
    mocksapphire = await MockSapphire.deploy(mockdai.address);
    await mocksapphire.deployed();
    mockruby = await MockRuby.deploy(mockdai.address);
    await mockruby.deployed();
    mockdiamond = await MockDiamond.deploy(mockdai.address);
    await mockdiamond.deployed();
    mocknode = await MockNode.deploy();
    await mocknode.deployed();

    redeem = await Redeem.deploy(
      mocknode.address, 
      mocksapphire.address,
      mockruby.address,
      mockdiamond.address
      );
    await redeem.deployed();
    
  });

  it("Should check if timer functions correctly", async function () {

    expect(checkTimer = await redeem.startTimer()).to.be.ok;

  });

  it("Should check if state flipper functions correctly", async function () {

    expect(await redeem.flipActive()).to.be.ok;
    expect(await redeem.redeemActive).to.not.equal(!redeem.redeemActive);
  });

  it("Should check if node address setter functions correctly", async function () {

    expect(await redeem.setNodeAddress("0x0000000000000000000000000000000000000000")).to.be.ok;

  });

  it("Should check if redeem functions correctly", async function () {
    // start timer
    await redeem.startTimer()
    // mint dai
    await mockdai.connect(acc1).mintTokens(acc1.address, "5000000000000000000000")
    await mockdai.connect(acc1).approve(mocksapphire.address, "5000000000000000000000")
    // buy presale nft
    await mocksapphire.connect(acc1).mintNode()
    await mocksapphire.connect(acc1).mintNode()
    await mocksapphire.connect(acc1).mintNode()
  
    // redeem from redeem contract
    await mocksapphire.connect(acc1).setApprovalForAll(redeem.address, true)
    await redeem.connect(acc1).redeem()
    expect(await mocknode.balanceOf(acc1.address)).to.equal(3)

    // check balance of caller (acc1)
    console.log("Presale balance: ", await mocksapphire.balanceOf(acc1.address)) // must return 0
    console.log("Node balance: ", await mocknode.balanceOf(acc1.address))
  });
});

describe("RedeemAccess", function () {

  let owner;
  let acc1;
  let acc2;
  let acc;

  beforeEach(async function () {
    MockDai = await ethers.getContractFactory("MockDAI");
    MockSapphire = await ethers.getContractFactory("MockSapphire");
    MockRuby = await ethers.getContractFactory("MockRuby");
    MockDiamond = await ethers.getContractFactory("MockDiamond");
    MockNode = await ethers.getContractFactory("MockNode");

    Redeem = await ethers.getContractFactory("Redeem");

    [owner, acc1, acc2, ...acc] = await ethers.getSigners();

    mockdai = await MockDai.deploy();
    await mockdai.deployed();
    mocksapphire = await MockSapphire.deploy(mockdai.address);
    await mocksapphire.deployed();
    mockruby = await MockRuby.deploy(mockdai.address);
    await mockruby.deployed();
    mockdiamond = await MockDiamond.deploy(mockdai.address);
    await mockdiamond.deployed();
    mocknode = await MockNode.deploy();
    await mocknode.deployed();

    redeem = await Redeem.deploy(
      mocknode.address, 
      mocksapphire.address,
      mockruby.address,
      mockdiamond.address
      );
    await redeem.deployed();
    
  });

  it("Expect a revert when a non-owner calls `setNodeAddress`", async function () {
      await expectRevert(redeem.connect(acc1).setNodeAddress("0x0000000000000000000000000000000000000000"), "Ownable: caller is not the owner")
  });

  it("Expect a revert when a non-owner calls `startTimer`", async function () {
      await expectRevert(redeem.connect(acc1).startTimer(), "Ownable: caller is not the owner")
  });

  it("Expect a revert when a non-owner calls `flipActive`", async function () {
      await expectRevert(redeem.connect(acc1).flipActive(), "Ownable: caller is not the owner")
  });

  it("Expect a revert when a non-holder calls redeem", async function () {
    // start timer
    // mint dai
    // buy presale nft
    // redeem from redeem contract
    // check balance of caller (acc2)
  });
});
