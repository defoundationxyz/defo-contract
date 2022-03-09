const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Access", function () {

  beforeEach(async function () {
    MockDai = await ethers.getContractFactory("MockDai")
    MockSapphire = await ethers.getContractFactory("MockSapphire")
    MockRuby = await ethers.getContractFactory("MockRuby")
    MockDiamond = await ethers.getContractFactory("MockDiamond")

    const [owner, acc1, acc2, ...acc] = await ethers.getSigners();

    mockdai = await MockDai.deploy()
    await mockdai.deployed()
    mocksapphire = await MockSapphire.deploy()
    await mocksapphire.deployed()
    mockruby = await MockRuby.deploy()
    await mockruby.deployed()
    mockdiamond = await MockDiamond.deploy()
    await mockdiamond.deployed()
    
  });

  it("Should return the new greeting once it's changed", async function () {
    
    //const setGreetingTx = await redeem.setGreeting("Hola, mundo!");

    // wait until the transaction is mined
    //await setGreetingTx.wait();

    //expect(await redeem.greet()).to.equal("Hola, mundo!");
  });
});
