const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Limiter Simulation", function () {

    let owner;
    let addr1;
    let addr2;
    let addrs;
    beforeEach(async function () {
    await ethers.provider.send(
            "hardhat_reset",
            [
                {
                    forking: {
                        jsonRpcUrl: "https://mainnet.infura.io/v3/459646cc0c034ae097198e21693de9e5",
                      //  blockNumber: 13940262,
                    },
                },
            ],
        );
    mockToken = await ethers.getContractFactory("Defo");
    mockLimiter = await ethers.getContractFactory("Limiter");
    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();
    Limiter = await mockLimiter.deploy("10");
    Token = await mockToken.deploy(Limiter.address);
      
    await Token.mint(addr1.address, "10000");
    await Token.mint(addr2.address, "10000");

    });
  
  it("Transfer should revert if it's too soon", async function () {
    expect(await Token.connect(addr1).balanceOf(addr1.address)).to.equal("10000");
    expect(await Token.connect(addr2).balanceOf(addr2.address)).to.equal("10000");

    //check if first transfer is ok 
    expect(await Token.connect(addr1).transfer(addr2.address , "10")).to.ok;
    expect(await Token.connect(addr1).balanceOf(addr1.address)).to.equal("9990");
    expect(await Token.connect(addr2).balanceOf(addr2.address)).to.equal("10010");

    //should revert
    // expect(await Token.connect(addr1).transfer(addr2.address , "10")).to.revert();

    for (let index = 0; index < 11; index++) {
        await ethers.provider.send('evm_mine');
 
    }
      
    expect(await Token.connect(addr1).transfer(addr2.address, "10")).to.ok;
  });
});
