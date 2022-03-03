const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Redeem", function () {
  it("Should return the new greeting once it's changed", async function () {
    const Redeem = await ethers.getContractFactory("Redeem");
    const redeem = await Redeem.deploy("Hello, world!");
    await redeem.deployed();

    //expect(await redeem.greet()).to.equal("Hello, world!");

    //const setGreetingTx = await redeem.setGreeting("Hola, mundo!");

    // wait until the transaction is mined
    //await setGreetingTx.wait();

    //expect(await redeem.greet()).to.equal("Hola, mundo!");
  });
});
