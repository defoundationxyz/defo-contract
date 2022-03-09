const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Limiter Simulation", function () {

    let owner;
    let addr1;
    let addr2;
    let addr3;
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
    mockToken = await ethers.getContractFactory("MockToken");
    mockLimiter = await ethers.getContractFactory("Limiter");
    [owner, addr1, addr2, addr3, ...addrs] = await ethers.getSigners();
    Limiter = await mockLimiter.deploy("10", addr3.address);
    Token = await mockToken.deploy(Limiter.address );
    Limiter.setToken(Token.address);
    await Token.mint(addr1.address, "10000");
    await Token.mint(addr2.address, "10000");

    });
  


  
});
