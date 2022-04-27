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
    MockDeltaSapphire = await ethers.getContractFactory("MockDeltaSapphire");
    MockOmegaSapphire = await ethers.getContractFactory("MockOmegaSapphire");
    MockDeltaRuby = await ethers.getContractFactory("MockDeltaRuby");
    MockOmegaRuby = await ethers.getContractFactory("MockOmegaRuby");
    MockDeltaDiamond = await ethers.getContractFactory("MockDeltaDiamond");
    MockOmegaDiamond = await ethers.getContractFactory("MockOmegaDiamond");

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
    mockdai = await MockDai.deploy();
    await mockdai.deployed();
    mockdeltasapphire = await MockDeltaSapphire.deploy(mockdai.address);
    mockomegasapphire = await MockOmegaSapphire.deploy(mockdai.address);
    await mockdeltasapphire.deployed();
    await mockomegasapphire.deployed();
    mockdeltaruby = await MockDeltaRuby.deploy(mockdai.address);
    mockomegaruby = await MockOmegaRuby.deploy(mockdai.address);
    await mockdeltaruby.deployed();
    await mockomegaruby.deployed();
    mockdeltadiamond = await MockDeltaDiamond.deploy(mockdai.address);
    mockomegadiamond = await MockOmegaDiamond.deploy(mockdai.address);
    await mockdeltadiamond.deployed();
    await mockomegadiamond.deployed();
    mocknode = await MockNode.deploy();
    await mocknode.deployed();

    redeem = await Redeem.deploy(
      mocknode.address, 
      mocksapphire.address,
      mockruby.address,
      mockdiamond.address,
      mockdeltasapphire.address,
      mockomegasapphire.address,
      mockdeltaruby.address,
      mockomegaruby.address,
      mockdeltadiamond.address,
      mockomegadiamond.address
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

  it("Should check if sapphire redeem functions correctly", async function () {
    // start timer
    await redeem.startTimer()
    // mint dai
    await mockdai.connect(acc1).mintTokens(acc1.address, "5400000000000000000000000")
    await mockdai.connect(acc1).approve(mocksapphire.address, "5400000000000000000000")
    // buy presale nft
    for (var i = 0; i < 3; i++) {
      
    await mocksapphire.connect(acc1).mintNode()
    }
    // redeem from redeem contract
    await mocksapphire.connect(acc1).setApprovalForAll(redeem.address, true)
    await redeem.connect(acc1).redeem()
    expect(await mocknode.balanceOf(acc1.address)).to.equal(3)
    // check balance of caller (acc1)
    console.log("Sapphire presale balance: ", await mocksapphire.balanceOf(acc1.address)) // must return 0
    console.log("Sapphire node redeem balance: ", await mocknode.balanceOf(acc1.address))
  });

  // `it("Should check if ruby redeem functions correctly", async function () {
  //   // start timer
  //   await redeem.startTimer()
  //   // // mint dai
  //   await mockdai.connect(acc1).mintTokens(acc[0].address, "72000000000000000000000")
  //   await mockdai.connect(acc[0]).approve(mockruby.address, "72000000000000000000000")
  //   // buy presale nft
  //   await mockruby.connect(acc[0]).mintNode()
  //   await mockruby.connect(acc[0]).mintNode()
  //   await mockruby.connect(acc[0]).mintNode()
  //   // redeem from redeem contract
  //   await mockruby.connect(acc[0]).setApprovalForAll(redeem.address, true)
  //   await redeem.connect(acc[0]).redeem()
  //   expect(await mocknode.balanceOf(acc[0].address)).to.equal(3)
  //   //check balance of caller (acc[0])
  //   console.log("Ruby presale balance: ", await mockruby.balanceOf(acc[0].address)) // must return 0
  //   console.log("Ruby node redeem balance: ", await mocknode.balanceOf(acc[0].address))
  // });

  // it("Should check if diamond redeem functions correctly", async function () {
  //   // start timer
  //   await redeem.startTimer()
  //   // // mint dai
  //   await mockdai.connect(acc1).mintTokens(acc[1].address, "200000000000000000000000")
  //   await mockdai.connect(acc[1]).approve(mockdiamond.address, "200000000000000000000000")
  //   // buy presale nft
  //   await mockdiamond.connect(acc[1]).mintNode()
  //   await mockdiamond.connect(acc[1]).mintNode()
  //   await mockdiamond.connect(acc[1]).mintNode()
  //   // redeem from redeem contract
  //   await mockdiamond.connect(acc[1]).setApprovalForAll(redeem.address, true)
  //   await redeem.connect(acc[1]).redeem()
  //   expect(await mocknode.balanceOf(acc[1].address)).to.equal(3)
  //   //check balance of caller (acc[1])
  //   console.log("Diamond presale balance: ", await mockdiamond.balanceOf(acc[1].address)) // must return 0
  //   console.log("Diamond node redeem balance: ", await mocknode.balanceOf(acc[1].address))
  // });

  // it("Should check if multiple redeems function correctly", async function () {
  //   // start timer
  //   await redeem.startTimer()
  //   // mint dai
  //   for (var i = 0; i < 3; i++) {
  //     await mockdai.connect(acc[2]).mintTokens(acc[2].address, "950000000000000000000000000")
  //     await mockdai.connect(acc[2]).approve(mocksapphire.address, "950000000000000000000000000")

  //   }
  //   // buy presale nft
  //   for (var i = 0; i < 6; i++) {
  //     await mocksapphire.connect(acc[2]).mintNode()

  //   }
  //   // redeem from redeem contract
  //   await mocksapphire.connect(acc[2]).setApprovalForAll(redeem.address, true)
  //   await mockruby.connect(acc[2]).setApprovalForAll(redeem.address, true)
  //   await mockdiamond.connect(acc[2]).setApprovalForAll(redeem.address, true)
  //   await redeem.connect(acc[2]).redeem()
  //   expect(await mocknode.balanceOf(acc[2].address)).to.equal(6)
  //   //check balance of caller (acc[2])
  //   console.log("Sapphire presale balance: ", await mocksapphire.balanceOf(acc[2].address)) // must return 0
  //   console.log("Ruby presale balance: ", await mockruby.balanceOf(acc[2].address)) // must return 0
  //   console.log("Diamond presale balance: ", await mockdiamond.balanceOf(acc[2].address)) // must return 0
  //   console.log("Diamond node redeem balance: ", await mocknode.balanceOf(acc[2].address))
  // });
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
    MockDeltaSapphire = await ethers.getContractFactory("MockDeltaSapphire");
    MockOmegaSapphire = await ethers.getContractFactory("MockOmegaSapphire");
    MockDeltaRuby = await ethers.getContractFactory("MockDeltaRuby");
    MockOmegaRuby = await ethers.getContractFactory("MockOmegaRuby");
    MockDeltaDiamond = await ethers.getContractFactory("MockDeltaDiamond");
    MockOmegaDiamond = await ethers.getContractFactory("MockOmegaDiamond");

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
    mockdai = await MockDai.deploy();
    await mockdai.deployed();
    mockdeltasapphire = await MockDeltaSapphire.deploy(mockdai.address);
    mockomegasapphire = await MockOmegaSapphire.deploy(mockdai.address);
    await mockdeltasapphire.deployed();
    await mockomegasapphire.deployed();
    mockdeltaruby = await MockDeltaRuby.deploy(mockdai.address);
    mockomegaruby = await MockOmegaRuby.deploy(mockdai.address);
    await mockdeltaruby.deployed();
    await mockomegaruby.deployed();
    mockdeltadiamond = await MockDeltaDiamond.deploy(mockdai.address);
    mockomegadiamond = await MockOmegaDiamond.deploy(mockdai.address);
    await mockdeltadiamond.deployed();
    await mockomegadiamond.deployed();
    mocknode = await MockNode.deploy();
    await mocknode.deployed();

    redeem = await Redeem.deploy(
      mocknode.address, 
      mocksapphire.address,
      mockruby.address,
      mockdiamond.address,
      mockdeltasapphire.address,
      mockomegasapphire.address,
      mockdeltaruby.address,
      mockomegaruby.address,
      mockdeltadiamond.address,
      mockomegadiamond.address
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
    await redeem.startTimer()
    // redeem from redeem contract
    await mocksapphire.connect(acc1).setApprovalForAll(redeem.address, true)
    await expectRevert(redeem.connect(acc1).redeem(), "VM Exception while processing transaction: reverted with reason string 'You are not in possesion of any presale nodes")
    
  });
});

describe ("RedeemFunctionality2", function () {
  let owner;
  let acc1;
  let acc2;
  let acc3;
  let acc;

  beforeEach(async function () {

    MockDai = await ethers.getContractFactory("MockDAI");
    MockDeltaSapphire = await ethers.getContractFactory("MockDeltaSapphire");
    MockOmegaSapphire = await ethers.getContractFactory("MockOmegaSapphire");
    MockDeltaRuby = await ethers.getContractFactory("MockDeltaRuby");
    MockOmegaRuby = await ethers.getContractFactory("MockOmegaRuby");
    MockDeltaDiamond = await ethers.getContractFactory("MockDeltaDiamond");
    MockOmegaDiamond = await ethers.getContractFactory("MockOmegaDiamond");
    MockNode = await ethers.getContractFactory("MockNode");

    Redeem = await ethers.getContractFactory("Redeem");


    [owner, acc1, acc2, ...acc] = await ethers.getSigners();

    mockdai = await MockDai.deploy();
    await mockdai.deployed();
    mockdeltasapphire = await MockDeltaSapphire.deploy(mockdai.address);
    mockomegasapphire = await MockOmegaSapphire.deploy(mockdai.address);
    await mockdeltasapphire.deployed();
    await mockomegasapphire.deployed();
    mockdeltaruby = await MockDeltaRuby.deploy(mockdai.address);
    mockomegaruby = await MockOmegaRuby.deploy(mockdai.address);
    await mockdeltaruby.deployed();
    await mockomegaruby.deployed();
    mockdeltadiamond = await MockDeltaDiamond.deploy(mockdai.address);
    mockomegadiamond = await MockOmegaDiamond.deploy(mockdai.address);
    await mockdeltadiamond.deployed();
    await mockomegadiamond.deployed();
    mocknode = await MockNode.deploy();
    await mocknode.deployed();

    redeem = await Redeem.deploy(
      mocknode.address, 
      mocksapphire.address,
      mockruby.address,
      mockdiamond.address,
      mockdeltasapphire.address,
      mockomegasapphire.address,
      mockdeltaruby.address,
      mockomegaruby.address,
      mockdeltadiamond.address,
      mockomegadiamond.address
      );
    await redeem.deployed();
    
  });

  it("Should check if sapphire redeem functions correctly", async function () {
    // start timer
    await redeem.startTimer()
    // mint dai
    await mockdai.connect(acc1).mintTokens(acc1.address, "5000000000000000000000")
    await mockdai.connect(acc1).approve(mocksapphire.address, "5000000000000000000000")
    // buy presale nft
    await mockdeltasapphire.connect(acc1).mintNode(3)
    await mockomegasapphire.connect(acc1).mintNode(3)

    // redeem from redeem contract
    await mockdeltasapphire.connect(acc1).setApprovalForAll(redeem.address, true)
    await mockomegasapphire.connect(acc1).setApprovalForAll(redeem.address, true)
    await redeem.connect(acc1).secondPresaleRedeem()
    //expect(await mocknode.balanceOf(acc1.address)).to.equal(3)
    // check balance of caller (acc1)
    console.log("Sapphire Delta presale balance: ", await mockdeltasapphire.balanceOf(acc1.address)) // must return 0
    console.log("Sapphire Omega presale balance: ", await mockomegasapphire.balanceOf(acc1.address)) // must return 0
    console.log("Sapphire node redeem balance: ", await mocknode.balanceOf(acc1.address))
  });

  it("Should check if ruby redeem functions correctly", async function () {
    // start timer
    await redeem.startTimer()
    // // mint dai
    await mockdai.connect(acc1).mintTokens(acc[0].address, "72000000000000000000000")
    await mockdai.connect(acc[0]).approve(mockruby.address, "72000000000000000000000")
    // buy presale nft
    await mockdeltaruby.connect(acc[0]).mintNode(3)
    await mockomegaruby.connect(acc[0]).mintNode(3)
    // redeem from redeem contract
    await mockdeltaruby.connect(acc[0]).setApprovalForAll(redeem.address, true)
    await mockomegaruby.connect(acc[0]).setApprovalForAll(redeem.address, true)
    await redeem.connect(acc[0]).secondPresaleRedeem()
    //expect(await mocknode.balanceOf(acc[0].address)).to.equal(3)
    //check balance of caller (acc[0])
    console.log("Ruby Delta presale balance: ", await mockruby.balanceOf(acc[0].address)) // must return 0
    console.log("Ruby Omega presale balance: ", await mockruby.balanceOf(acc[0].address)) // must return 0
    console.log("Ruby node redeem balance: ", await mocknode.balanceOf(acc[0].address))
  });

  it("Should check if diamond redeem functions correctly", async function () {
    // start timer
    await redeem.startTimer()
    // // mint dai
    await mockdai.connect(acc1).mintTokens(acc[1].address, "200000000000000000000000")
    await mockdai.connect(acc[1]).approve(mockdiamond.address, "200000000000000000000000")
    // buy presale nft
    await mockdeltadiamond.connect(acc[1]).mintNode(3)
    await mockomegadiamond.connect(acc[1]).mintNode(3)
    // redeem from redeem contract
    await mockdeltadiamond.connect(acc[1]).setApprovalForAll(redeem.address, true)
    await mockomegadiamond.connect(acc[1]).setApprovalForAll(redeem.address, true)
    await redeem.connect(acc[1]).secondPresaleRedeem()
    //expect(await mocknode.balanceOf(acc[1].address)).to.equal(3)
    //check balance of caller (acc[1])
    console.log("Diamond Delta presale balance: ", await mockdiamond.balanceOf(acc[1].address)) // must return 0
    console.log("Diamond Omega presale balance: ", await mockdiamond.balanceOf(acc[1].address)) // must return 0
    console.log("Diamond node redeem balance: ", await mocknode.balanceOf(acc[1].address))
  });

  it("Should check if multiple redeems function correctly", async function () {
    // start timer
    await redeem.startTimer()
    // mint dai
    for (var i = 0; i < 3; i++) {
    await mockdai.connect(acc[2]).mintTokens(acc[2].address, "950000000000000000000000000")
    await mockdai.connect(acc[2]).approve(mocksapphire.address, "950000000000000000000000000")
    }
    // buy presale nft
    await mockdeltasapphire.connect(acc[2]).mintNode(1)
    await mockomegasapphire.connect(acc[2]).mintNode(1)
    await mockdeltaruby.connect(acc[2]).mintNode(1)
    await mockomegaruby.connect(acc[2]).mintNode(1)
    await mockdeltadiamond.connect(acc[2]).mintNode(1)
    await mockomegadiamond.connect(acc[2]).mintNode(1)
    // redeem from redeem contract
    await mockdeltasapphire.connect(acc[2]).setApprovalForAll(redeem.address, true)
    await mockomegasapphire.connect(acc[2]).setApprovalForAll(redeem.address, true)
    await mockdeltaruby.connect(acc[2]).setApprovalForAll(redeem.address, true)
    await mockomegaruby.connect(acc[2]).setApprovalForAll(redeem.address, true)
    await mockdeltadiamond.connect(acc[2]).setApprovalForAll(redeem.address, true)
    await mockomegadiamond.connect(acc[2]).setApprovalForAll(redeem.address, true)
    await redeem.connect(acc[2]).secondPresaleRedeem()
    //expect(await mocknode.balanceOf(acc[2].address)).to.equal(6)
    //check balance of caller (acc[2])
    console.log("Sapphire Delta presale balance: ", await mocksapphire.balanceOf(acc[2].address)) // must return 0
    console.log("Sapphire Omega presale balance: ", await mocksapphire.balanceOf(acc[2].address)) // must return 0
    console.log("Ruby Delta presale balance: ", await mockruby.balanceOf(acc[2].address)) // must return 0
    console.log("Ruby Omega presale balance: ", await mockruby.balanceOf(acc[2].address)) // must return 0
    console.log("Diamond Delta presale balance: ", await mockdiamond.balanceOf(acc[2].address)) // must return 0
    console.log("Diamond Omega presale balance: ", await mockdiamond.balanceOf(acc[2].address)) // must return 0
    console.log("Node redeem balance: ", await mocknode.balanceOf(acc[2].address))
  });
});