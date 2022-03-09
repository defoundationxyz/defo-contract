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

describe("Redeem", function () {

  beforeEach(async function () {
    MockDai = await ethers.getContractFactory("MockDai")
    MockSapphire = await ethers.getContractFactory("MockSapphire")
    MockRuby = await ethers.getContractFactory("MockRuby")
    MockDiamond = await ethers.getContractFactory("MockDiamond")
    MockNode = await ethers.getContractFactory("MockNode")

    const [owner, acc1, acc2, ...acc] = await ethers.getSigners();

    mockdai = await MockDai.deploy()
    await mockdai.deployed()
    mocksapphire = await MockSapphire.deploy()
    await mocksapphire.deployed()
    mockruby = await MockRuby.deploy()
    await mockruby.deployed()
    mockdiamond = await MockDiamond.deploy()
    await mockdiamond.deployed()
    mocknode = await MockDiamond.deploy()
    await mocknode.deployed()
    
  });

  it("Should check if timer functions correctly", async function () {

    //const setGreetingTx = await redeem.setGreeting("Hola, mundo!");

    // wait until the transaction is mined
    //await setGreetingTx.wait();

    //expect(await redeem.greet()).to.equal("Hola, mundo!");
  });

  it("Should check if state flipper functions correctly", async function () {

    //const setGreetingTx = await redeem.setGreeting("Hola, mundo!");

    // wait until the transaction is mined
    //await setGreetingTx.wait();

    //expect(await redeem.greet()).to.equal("Hola, mundo!");
  });

  it("Should check if node address setter functions correctly", async function () {

    //const setGreetingTx = await redeem.setGreeting("Hola, mundo!");

    // wait until the transaction is mined
    //await setGreetingTx.wait();

    //expect(await redeem.greet()).to.equal("Hola, mundo!");
  });

  it("Should check if redeem functions correctly", async function () {

    //const setGreetingTx = await redeem.setGreeting("Hola, mundo!");

    // wait until the transaction is mined
    //await setGreetingTx.wait();

    //expect(await redeem.greet()).to.equal("Hola, mundo!");
  });
});
