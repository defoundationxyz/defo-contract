const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Node Tests", function () {

    let owner;
    let addr1;
    let addr2;
    let addr3;
    let addrs;
    beforeEach(async function () {
    /*await ethers.provider.send(
            "hardhat_reset",
            [
                {
                    forking: {
                        jsonRpcUrl: "https://mainnet.infura.io/v3/459646cc0c034ae097198e21693de9e5",
                      //  blockNumber: 13940262,
                    },
                },
            ],
        );*/
    mockToken = await ethers.getContractFactory("MockToken");
    mockLimiter = await ethers.getContractFactory("Limiter");
    node = await ethers.getContractFactory("DefoNode");
    [owner, addr1, addr2, addr3, ...addrs] = await ethers.getSigners();
    Limiter = await mockLimiter.deploy();
    Token = await mockToken.deploy();
    DAI = await mockToken.deploy();
    NodeInst = await node.deploy(owner.address, Token.address, DAI.address, owner.address, Limiter.address, owner.address);
    await Token.mint(addr1.address, ethers.utils.parseEther( "10000000"));
    await Token.mint(owner.address,ethers.utils.parseEther( "10000000"));
    await DAI.mint(owner.address, ethers.utils.parseEther( "10000000"));
    await Token.mint(addr1.address,ethers.utils.parseEther( "10000000"));
    await Token.mint(addr2.address,ethers.utils.parseEther( "10000000"));

    await DAI.mint(addr1.address, ethers.utils.parseEther( "10000000"));
    await DAI.mint(addr2.address, ethers.utils.parseEther( "10000000"));

    });
  
    it("Test minting nodes", async function () {
        //var before = await Token.balanceOf(addr1.address);
        //var beforeDAI = await DAI.balanceOf(addr1.address);
        expect(await NodeInst.changeDonationAddress(owner.address)).to.ok;
        expect(await NodeInst.changeTeamAddress(owner.address)).to.ok;
        expect(await NodeInst.changeMarketingAddress(owner.address)).to.ok;
        expect(await NodeInst.changeBuybackAddress(owner.address)).to.ok;        
        expect(await Token.connect(addr1).approve(NodeInst.address, "10000000000000")).ok;
        expect(await DAI.connect(addr1).approve(NodeInst.address , "10000000000000")).ok;
        expect(await NodeInst.SetNodePrice("0", "10", "10")).to.ok;
        expect(await NodeInst.SetNodePrice("1", "100", "100" )).to.ok;
        expect(await NodeInst.SetNodePrice("2", "1000", "1000")).to.ok;
        expect(await NodeInst.connect(addr1).MintNode("0")).to.ok;
        expect(await NodeInst.connect(addr1).MintNode("1")).to.ok;
        expect(await NodeInst.connect(addr1).MintNode("2")).to.ok;
        //expect(await Token.balanceOf(addr1.address)).to.eq(before - 1110);    
        //expect(await DAI.balanceOf(addr1.address)).to.eq(beforeDAI- 1110);
    });

    
    it("Test redeem", async function () {
        expect(await NodeInst.RedeemMint("0" , addr1.address)).to.ok;
        expect(await NodeInst.RedeemMint("1", addr1.address)).to.ok;
        expect(await NodeInst.RedeemMint("2" , addr1.address)).to.ok;

    });

    it("Test maintain", async function () {
        expect(await Token.connect(addr1).approve(NodeInst.address, "10000000000000")).ok;
        expect(await DAI.connect(addr1).approve(NodeInst.address, "100000000000000000000000")).ok;
        await DAI.mint(addr1.address, "100000000000000000000000");
        expect(await NodeInst.changeDonationAddress(owner.address)).to.ok;
        expect(await NodeInst.changeTeamAddress(owner.address)).to.ok;
        expect(await NodeInst.changeMarketingAddress(owner.address)).to.ok;
        expect(await NodeInst.changeBuybackAddress(owner.address)).to.ok;             
        expect(await NodeInst.SetNodePrice("0", "10", "10")).to.ok;
        expect(await NodeInst.SetNodePrice("1", "100", "100" )).to.ok;
        expect(await NodeInst.SetNodePrice("2", "1000", "1000")).to.ok;
        expect(await NodeInst.setMaintenanceRate("0", "10" )).to.ok;
        expect(await NodeInst.setMaintenanceRate("1", "100" )).to.ok;
        expect(await NodeInst.setMaintenanceRate("2" , "1000")).to.ok;        
        expect(await NodeInst.connect(addr1).MintNode("0")).to.ok;
        expect(await NodeInst.connect(addr1).MintNode("1")).to.ok;
        expect(await NodeInst.connect(addr1).MintNode("2")).to.ok;
        expect(await NodeInst.connect(addr1).checkPendingMaintenance("0")).to.gt("0");
        var before = await NodeInst.connect(addr1).checkPendingMaintenance("0")
        for (let index = 0; index < 365; index++) {
            await network.provider.send("evm_increaseTime", [86400])
            await ethers.provider.send('evm_mine');
        
      }
        expect(await NodeInst.connect(addr1).checkPendingMaintenance("0")).to.gt(before);
        expect(await NodeInst.connect(addr1).Maintenance("0")).to.ok;
        expect(await NodeInst.connect(addr1).checkPendingMaintenance("0")).to.lt(before);


        for (let index = 0; index < 365; index++) {
            await network.provider.send("evm_increaseTime", [86400])
            await ethers.provider.send('evm_mine');
        
      }
        expect(await NodeInst.connect(addr1).MaintenanceAll()).to.ok;
        expect(await NodeInst.connect(addr1).checkPendingMaintenance("1")).to.lt("85239400");
        expect(await NodeInst.connect(addr1).checkPendingMaintenance("2")).to.lt("852394000");
    });

    it("Test reward", async function () {
        expect(await Token.connect(addr1).approve(NodeInst.address,ethers.utils.parseEther( "100000000000000000000000"))).ok;
        expect(await DAI.connect(addr1).approve(NodeInst.address, ethers.utils.parseEther( "100000000000000000000000"))).ok;
        await DAI.mint(addr1.address,ethers.utils.parseEther( "10000000"));
        expect(await NodeInst.changeDonationAddress(owner.address)).to.ok;
        expect(await NodeInst.changeTeamAddress(owner.address)).to.ok;
        expect(await NodeInst.changeMarketingAddress(owner.address)).to.ok;
        expect(await NodeInst.changeBuybackAddress(owner.address)).to.ok;        
        expect(await NodeInst.setRewardTax(["500", "300", "100", "0"])).to.ok;
        expect(await NodeInst.SetNodePrice("0",  ethers.utils.parseEther("10"), ethers.utils.parseEther("10"))).to.ok;
        expect(await NodeInst.SetNodePrice("1", ethers.utils.parseEther("100"), ethers.utils.parseEther("100") )).to.ok;
        expect(await NodeInst.SetNodePrice("2", ethers.utils.parseEther("1000") , ethers.utils.parseEther("1000"))).to.ok;
        expect(await NodeInst.setRewardRate("0", "10" )).to.ok;
        expect(await NodeInst.setRewardRate("1", "10" )).to.ok;
        expect(await NodeInst.setRewardRate("2", "10")).to.ok;
        //expect(await NodeInst.setMinDaiReward("1")).to.ok;         
        expect(await NodeInst.connect(addr1).MintNode("0")).to.ok;
        expect(await NodeInst.connect(addr1).MintNode("1")).to.ok;
        expect(await NodeInst.connect(addr1).MintNode("2")).to.ok;
        expect(await NodeInst.connect(addr1).checkReward("0")).to.ok;

        for (let index = 0; index < 10; index++) {
            await network.provider.send("evm_increaseTime", [86400])
            await ethers.provider.send('evm_mine');
        
        } 
        /// tresury must approve
        expect(await Token.approve(NodeInst.address, "100000000000000000000000")).ok;
        expect(await DAI.approve(NodeInst.address, "100000000000000000000000")).ok;        
        /// expect revert 
        //expect(await NodeInst.connect(addr1).ClaimRewardsAll()).to.ok;
        expect(await NodeInst.connect(addr1).MaintenanceAll()).to.ok;
        expect(await NodeInst.connect(addr1).ClaimRewardsAll()).to.ok;

    });
  
    it("Test compound", async function () {
        expect(await Token.connect(addr1).approve(NodeInst.address,ethers.utils.parseEther( "100000000000000000000000"))).ok;
        expect(await DAI.connect(addr1).approve(NodeInst.address, ethers.utils.parseEther( "100000000000000000000000"))).ok;
        await DAI.mint(addr1.address, "100000000000000000000000");
        expect(await NodeInst.changeDonationAddress(owner.address)).to.ok;
        expect(await NodeInst.changeTeamAddress(owner.address)).to.ok;
        expect(await NodeInst.changeMarketingAddress(owner.address)).to.ok;
        expect(await NodeInst.changeBuybackAddress(owner.address)).to.ok;   
        expect(await NodeInst.setRewardTax(["500", "300", "100", "0"])).to.ok;        
        expect(await NodeInst.SetNodePrice("0",  ethers.utils.parseEther("10"), ethers.utils.parseEther("10"))).to.ok;
        expect(await NodeInst.SetNodePrice("1", ethers.utils.parseEther("100"), ethers.utils.parseEther("100") )).to.ok;
        expect(await NodeInst.SetNodePrice("2", ethers.utils.parseEther("1000") , ethers.utils.parseEther("1000"))).to.ok;
        expect(await NodeInst.setRewardRate("0", "100" )).to.ok;
        expect(await NodeInst.setRewardRate("1", "100" )).to.ok;
        expect(await NodeInst.setRewardRate("2", "100")).to.ok;
        //expect(await NodeInst.setMinDaiReward("1")).to.ok;         
        expect(await NodeInst.connect(addr1).MintNode("0")).to.ok;
        expect(await NodeInst.connect(addr1).MintNode("1")).to.ok;
        expect(await NodeInst.connect(addr1).MintNode("2")).to.ok;
        expect(await NodeInst.connect(addr1).checkReward("0")).to.ok;

        for (let index = 0; index < 200; index++) {
            await network.provider.send("evm_increaseTime", [86400])
            await ethers.provider.send('evm_mine');
        
        } 
        /// tresury must approve
        expect(await Token.approve(NodeInst.address, "100000000000000000000000")).ok;
        expect(await DAI.approve(NodeInst.address, "100000000000000000000000")).ok;        

        expect(await NodeInst.connect(addr1).balanceOf(addr1.address)).to.eq("3");
        expect(await NodeInst.connect(addr1).MaintenanceAll()).to.ok;
        //var before = await Token.balanceOf(addr1.address);
        //var beforeDAI = await DAI.balanceOf(addr1.address);
        expect(await NodeInst.connect(addr1).Compound("0")).to.ok;
        expect(await NodeInst.connect(addr1).balanceOf(addr1.address)).to.eq("4");
        //expect(await Token.balanceOf(addr1.address)).to.gt(before);    
        //expect(await DAI.balanceOf(addr1.address)).to.gt(beforeDAI);
    });

    it("Test compoundAll", async function () {
            await Token.mint(owner.address,ethers.utils.parseEther( "100000000000000000000"));
        expect(await Token.connect(addr1).approve(NodeInst.address, "115792089237316195423570985008687907853269984665640564039457584007913129639935")).ok;
        expect(await DAI.connect(addr1).approve(NodeInst.address, "115792089237316195423570985008687907853269984665640564039457584007913129639935")).ok;
        //await DAI.mint(addr1.address, "100000000000000000000000");
        expect(await NodeInst.changeDonationAddress(owner.address)).to.ok;
        expect(await NodeInst.changeTeamAddress(owner.address)).to.ok;
        expect(await NodeInst.changeMarketingAddress(owner.address)).to.ok;
        expect(await NodeInst.changeBuybackAddress(owner.address)).to.ok;             
        expect(await NodeInst.setRewardTax(["500", "300", "100", "0"])).to.ok;        
        expect(await NodeInst.SetNodePrice("0",  ethers.utils.parseEther("10"), ethers.utils.parseEther("10"))).to.ok;
        expect(await NodeInst.SetNodePrice("1", ethers.utils.parseEther("100"), ethers.utils.parseEther("100") )).to.ok;
        expect(await NodeInst.SetNodePrice("2", ethers.utils.parseEther("1000") , ethers.utils.parseEther("1000"))).to.ok;
        expect(await NodeInst.setRewardRate("0", "100" )).to.ok;
        expect(await NodeInst.setRewardRate("1", "100" )).to.ok;
        expect(await NodeInst.setRewardRate("2", "100")).to.ok;
        //expect(await NodeInst.setMinDaiReward("1")).to.ok;         
        expect(await NodeInst.connect(addr1).MintNode("0")).to.ok;
        expect(await NodeInst.connect(addr1).MintNode("1")).to.ok;
        expect(await NodeInst.connect(addr1).MintNode("2")).to.ok;
        expect(await NodeInst.connect(addr1).checkReward("0")).to.ok;

        for (let index = 0; index < 2000; index++) {
            await network.provider.send("evm_increaseTime", [86400])
            await ethers.provider.send('evm_mine');
        
        } 
        /// tresury must approve
        expect(await Token.approve(NodeInst.address,"115792089237316195423570985008687907853269984665640564039457584007913129639935")).ok;
        expect(await DAI.approve(NodeInst.address, "115792089237316195423570985008687907853269984665640564039457584007913129639935")).ok;        

        expect(await NodeInst.connect(addr1).balanceOf(addr1.address)).to.eq("3");
        expect(await NodeInst.connect(addr1).MaintenanceAll()).to.ok;
        //var before = await Token.balanceOf(addr1.address);
        //var beforeDAI = await DAI.balanceOf(addr1.address);
        expect(await NodeInst.connect(addr1).CompoundAll()).to.ok;
        expect(await NodeInst.connect(addr1).balanceOf(addr1.address)).to.eq("6");
        //expect(await Token.balanceOf(addr1.address)).to.gt(before);    
        //expect(await DAI.balanceOf(addr1.address)).to.gt(beforeDAI);
    });


        it("Test upfront maintain", async function () {
        expect(await Token.connect(addr1).approve(NodeInst.address,ethers.utils.parseEther( "100000000000000000000000"))).ok;
        expect(await DAI.connect(addr1).approve(NodeInst.address, ethers.utils.parseEther( "100000000000000000000000"))).ok;
            await DAI.mint(addr1.address, "100000000000000000000000");
        expect(await NodeInst.changeDonationAddress(owner.address)).to.ok;
        expect(await NodeInst.changeTeamAddress(owner.address)).to.ok;
        expect(await NodeInst.changeMarketingAddress(owner.address)).to.ok;
        expect(await NodeInst.changeBuybackAddress(owner.address)).to.ok;                 
        expect(await NodeInst.SetNodePrice("0",  ethers.utils.parseEther("10"), ethers.utils.parseEther("10"))).to.ok;
        expect(await NodeInst.SetNodePrice("1", ethers.utils.parseEther("100"), ethers.utils.parseEther("100") )).to.ok;
        expect(await NodeInst.SetNodePrice("2", ethers.utils.parseEther("1000") , ethers.utils.parseEther("1000"))).to.ok;
        expect(await NodeInst.setRewardRate("0", "10" )).to.ok;
        expect(await NodeInst.setRewardRate("1", "10" )).to.ok;
        expect(await NodeInst.setRewardRate("2", "10")).to.ok;    
        expect(await NodeInst.connect(addr1).MintNode("0")).to.ok;
        expect(await NodeInst.connect(addr1).MintNode("1")).to.ok;
        expect(await NodeInst.connect(addr1).MintNode("2")).to.ok;
        expect(await NodeInst.connect(addr1).checkPendingMaintenance("0")).to.eq("0");
        for (let index = 0; index < 200; index++) {
            await network.provider.send("evm_increaseTime", [360000])
            await ethers.provider.send('evm_mine');
        
      }
        var before = await NodeInst.connect(addr1).checkPendingMaintenance("0")
        expect(await NodeInst.connect(addr1).MaintenanceUpfront("0" , "200") ).to.ok;
        expect(await NodeInst.connect(addr1).checkPendingMaintenance("0")).to.lt(before);
        for (let index = 0; index < 2000; index++) {
            await network.provider.send("evm_increaseTime", [3600])
            await ethers.provider.send('evm_mine');
        
      }
        expect(await NodeInst.connect(addr1).checkPendingMaintenance("0")).to.eq("0");


    });

});