const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Node Tests", function () {

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
    node = await ethers.getContractFactory("DefoNode");
    [owner, addr1, addr2, addr3, ...addrs] = await ethers.getSigners();
    Limiter = await mockLimiter.deploy();
    Token = await mockToken.deploy();
    DAI = await mockToken.deploy();
    NodeInst = await node.deploy(owner.address, Token.address, DAI.address, owner.address, Limiter.address, owner.address);
    await Token.mint(addr1.address, "10000000000");
    await Token.mint(addr1.address, "10000");
    await Token.mint(addr2.address, "10000");

    await DAI.mint(addr1.address, "10000");
    await DAI.mint(addr2.address, "10000");

    });
  
    it("Test minting nodes", async function () {
        var before = await Token.balanceOf(addr1.address);
        var beforeDAI = await DAI.balanceOf(addr1.address);
        expect(await Token.connect(addr1).approve(NodeInst.address, "10000000000000")).ok;
        expect(await DAI.connect(addr1).approve(NodeInst.address , "10000000000000")).ok;
        expect(await NodeInst.SetNodePrice("0", "10" , "10")).to.ok;
        expect(await NodeInst.SetNodePrice("1", "100" , "100")).to.ok;
        expect(await NodeInst.SetNodePrice("2" , "1000" , "1000")).to.ok;
        expect(await NodeInst.connect(addr1).MintNode("0")).to.ok;
        expect(await NodeInst.connect(addr1).MintNode("1")).to.ok;
        expect(await NodeInst.connect(addr1).MintNode("2")).to.ok;
        expect(await Token.balanceOf(addr1.address)).to.eq(before - 1110);    
        expect(await DAI.balanceOf(addr1.address)).to.eq(beforeDAI- 1110);
    });

    
    it("Test redeem", async function () {
        expect(await NodeInst.RedeemMint("0" , addr1.address)).to.ok;
        expect(await NodeInst.RedeemMint("1", addr1.address)).to.ok;
        expect(await NodeInst.RedeemMint("2" , addr1.address)).to.ok;

    });



  
});
