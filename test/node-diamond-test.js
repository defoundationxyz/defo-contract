const { expect } = require("chai");
const { ethers } = require("hardhat");
const {
  getSelectors,
  FacetCutAction,
  removeSelectors,
  findAddressPositionInFacets
} = require('../scripts/libraries/diamond.js')

const { deployDiamond } = require('../scripts/deploy.js')

describe("Node Tests", function () {
  let diamondAddress
  let diamondCutFacet
  let diamondLoupeFacet
  let ownershipFacet   
  let ERC721Facet
  let ERC721EnumerableFacet
  let GemFacet
  let VaultStakingFacet
  let GettersFacet
  let OwnerFacet
  let tx
  let receipt
  let result

    let owner;
    let addr1;
    let addr2;
    let addr3;
    let addrs;
    beforeEach(async function () {

    mockToken = await ethers.getContractFactory("MockToken");
        diamondAddress = await deployDiamond();
        diamondCutFacet = await ethers.getContractAt('DiamondCutFacet', diamondAddress);
        diamondLoupeFacet = await ethers.getContractAt('DiamondLoupeFacet', diamondAddress);
        ownershipFacet = await ethers.getContractAt('OwnershipFacet', diamondAddress);
        OwnerFacet = await ethers.getContractAt('OwnerFacet', diamondAddress);
        ERC721Facet = await ethers.getContractAt('ERC721Facet', diamondAddress);
        ERC721EnumerableFacet = await ethers.getContractAt('ERC721EnumerableFacet', diamondAddress);
        GemFacet = await ethers.getContractAt('GemFacet', diamondAddress);
        VaultStakingFacet = await ethers.getContractAt('VaultStakingFacet', diamondAddress);
        GettersFacet = await ethers.getContractAt('GettersFacet', diamondAddress);
    [owner, addr1, addr2, addr3, ...addrs] = await ethers.getSigners();

    Token = await mockToken.deploy();
    DAI = await mockToken.deploy();

    expect(await OwnerFacet.initialize(owner.address, Token.address, DAI.address, owner.address, diamondAddress, owner.address, owner.address)).to.ok;
        
        
    await Token.mint(addr1.address, ethers.utils.parseEther( "10000000"));
    await Token.mint(owner.address,ethers.utils.parseEther( "10000000"));
    await DAI.mint(owner.address, ethers.utils.parseEther( "10000000"));
    await Token.mint(addr1.address,ethers.utils.parseEther( "10000000"));
    await Token.mint(addr2.address,ethers.utils.parseEther( "10000000"));

    await DAI.mint(addr1.address, ethers.utils.parseEther( "10000000"));
    await DAI.mint(addr2.address, ethers.utils.parseEther("10000000"));
    const saphireGem = {
      LastMint: "0",
      MaintenanceFee: "0",
      RewardRate: "10",
      DailyLimit: "5",
      MintCount: "0",
      DefoPrice: ethers.utils.parseEther("10"),
      StablePrice : ethers.utils.parseEther("10")
    }
    const rubyGem = {
      LastMint: "0",
      MaintenanceFee: "0",
      RewardRate: "10",
      DailyLimit: "5",
      MintCount: "0",
      DefoPrice: ethers.utils.parseEther("100"),
      StablePrice : ethers.utils.parseEther("100")
    }
    const diamondGem = {
      LastMint: "0",
      MaintenanceFee: "0",
      RewardRate: "10",
      DailyLimit: "5",
      MintCount: "0",
      DefoPrice: ethers.utils.parseEther("1000"),
      StablePrice :  ethers.utils.parseEther("1000")
    }
    expect(await Token.connect(addr1).approve(diamondAddress,ethers.utils.parseEther( "100000000000000000000000"))).ok;
    expect(await DAI.connect(addr1).approve(diamondAddress, ethers.utils.parseEther( "100000000000000000000000"))).ok;
    await DAI.mint(addr1.address,ethers.utils.parseEther( "10000000"));
    expect(await OwnerFacet.setAddressAndDistTeam(owner.address , 75 , 75)).to.ok;    
    expect(await OwnerFacet.setRewardTax(["500", "300", "100", "0"])).to.ok;
    expect(await OwnerFacet.setGemSettings("0", saphireGem)).to.ok;
    expect(await OwnerFacet.setGemSettings("1", rubyGem)).to.ok;
    expect(await OwnerFacet.setGemSettings("2", diamondGem)).to.ok;

    });
  
    it("Test minting nodes", async function () {
        expect(await GemFacet.connect(addr1).MintGem("0")).to.ok;
        expect(await GemFacet.connect(addr1).MintGem("1")).to.ok;
        expect(await GemFacet.connect(addr1).MintGem("2")).to.ok;
        //expect(await Token.balanceOf(addr1.address)).to.eq(before - 1110);    
        //expect(await DAI.balanceOf(addr1.address)).to.eq(beforeDAI- 1110);
    });

    
    it("Test redeem", async function () {
        expect(await GemFacet.RedeemMint("0" , addr1.address)).to.ok;
        expect(await GemFacet.RedeemMint("1", addr1.address)).to.ok;
        expect(await GemFacet.RedeemMint("2" , addr1.address)).to.ok;

    });

    it("Test maintain", async function () {
            const saphireGem = {
      LastMint: "0",
      MaintenanceFee: "10",
      RewardRate: "10",
      DailyLimit: "5",
      MintCount: "0",
      DefoPrice: ethers.utils.parseEther("10"),
      StablePrice : ethers.utils.parseEther("10")
    }
    const rubyGem = {
      LastMint: "0",
      MaintenanceFee: "100",
      RewardRate: "10",
      DailyLimit: "5",
      MintCount: "0",
      DefoPrice: ethers.utils.parseEther("100"),
      StablePrice : ethers.utils.parseEther("100")
    }
    const diamondGem = {
      LastMint: "0",
      MaintenanceFee: "1000",
      RewardRate: "10",
      DailyLimit: "5",
      MintCount: "0",
      DefoPrice: ethers.utils.parseEther("1000"),
      StablePrice :  ethers.utils.parseEther("1000")
    }
        
        expect(await OwnerFacet.setGemSettings("0", saphireGem)).to.ok;
        expect(await OwnerFacet.setGemSettings("1", rubyGem)).to.ok;
        expect(await OwnerFacet.setGemSettings("2", diamondGem)).to.ok;
              
        expect(await GemFacet.connect(addr1).MintGem("0")).to.ok;
        expect(await GemFacet.connect(addr1).MintGem("1")).to.ok;
        expect(await GemFacet.connect(addr1).MintGem("2")).to.ok;
        expect(await GemFacet.connect(addr1).checkPendingMaintenance("0")).to.eq("0");
        var before = await GemFacet.connect(addr1).checkPendingMaintenance("0")
        for (let index = 0; index < 365; index++) {
            await network.provider.send("evm_increaseTime", [86400])
            await ethers.provider.send('evm_mine');
        
      }
        expect(await GemFacet.connect(addr1).checkPendingMaintenance("0")).to.gt(before);
        expect(await GemFacet.connect(addr1).Maintenance("0" , "0")).to.ok;
        expect(await GemFacet.connect(addr1).checkPendingMaintenance("0")).to.eq(before);


        for (let index = 0; index < 365; index++) {
            await network.provider.send("evm_increaseTime", [86400])
            await ethers.provider.send('evm_mine');
        
      }
        expect(await GemFacet.connect(addr1).MaintenanceAll("0")).to.ok;
        expect(await GemFacet.connect(addr1).checkPendingMaintenance("1")).to.lt("85239400");
        expect(await GemFacet.connect(addr1).checkPendingMaintenance("2")).to.lt("852394000");
    });

    it("Test reward", async function () {

        //expect(await NodeInst.setMinDaiReward("1")).to.ok;         
        expect(await GemFacet.connect(addr1).MintGem("0")).to.ok;
        expect(await GemFacet.connect(addr1).MintGem("1")).to.ok;
        expect(await GemFacet.connect(addr1).MintGem("2")).to.ok;
        expect(await GemFacet.connect(addr1).checkRawReward("0")).to.ok;

        for (let index = 0; index < 2; index++) {
            await network.provider.send("evm_increaseTime", [86400 * 365])
            await ethers.provider.send('evm_mine');
        
        } 
        /// tresury must approve
        expect(await Token.approve(diamondAddress, "100000000000000000000000")).ok;
        expect(await DAI.approve(diamondAddress, "100000000000000000000000")).ok;        
        /// expect revert 
        //expect(await NodeInst.connect(addr1).ClaimRewardsAll()).to.ok;
        expect(await GemFacet.connect(addr1).MaintenanceAll("0")).to.ok;
        expect(await GemFacet.connect(addr1).ClaimRewards("0")).to.ok;

    });
  

    it("Test taper", async function () {
  
        expect(await GemFacet.connect(addr1).MintGem("0")).to.ok;
        expect(await GemFacet.connect(addr1).MintGem("1")).to.ok;
        expect(await GemFacet.connect(addr1).MintGem("2")).to.ok;
        expect(await GemFacet.connect(addr1).checkRawReward("0")).to.ok;

        for (let index = 0; index < 2; index++) {
            await network.provider.send("evm_increaseTime", [86400 * 365])
            await ethers.provider.send('evm_mine');
        
        } 
        expect(await GemFacet.checkTaperedReward("0")).to.lt(await GemFacet.checkRawReward("0"));

    });
  

    it("Test compound", async function () {
    
        expect(await GemFacet.connect(addr1).MintGem("0")).to.ok;
        expect(await GemFacet.connect(addr1).MintGem("1")).to.ok;
        expect(await GemFacet.connect(addr1).MintGem("2")).to.ok;


        for (let index = 0; index < 200; index++) {
            await network.provider.send("evm_increaseTime", [86400])
            await ethers.provider.send('evm_mine');
        
        } 
        /// tresury must approve
        expect(await Token.approve(diamondAddress, "100000000000000000000000")).ok;
        expect(await DAI.approve(diamondAddress, "100000000000000000000000")).ok;        

        expect(await ERC721Facet.connect(addr1).balanceOf(addr1.address)).to.eq("3");
        expect(await GemFacet.connect(addr1).MaintenanceAll("0")).to.ok;
        //var before = await Token.balanceOf(addr1.address);
        //var beforeDAI = await DAI.balanceOf(addr1.address);
        expect(await GemFacet.connect(addr1).Compound("0" , "0")).to.ok;
        expect(await ERC721Facet.connect(addr1).balanceOf(addr1.address)).to.eq("4");
        //expect(await Token.balanceOf(addr1.address)).to.gt(before);    
        //expect(await DAI.balanceOf(addr1.address)).to.gt(beforeDAI);
    });
/*
    it("Test compoundAll", async function () {
 
        expect(await NodeInst.connect(addr1).MintNode("0")).to.ok;
        expect(await NodeInst.connect(addr1).MintNode("1")).to.ok;
        expect(await NodeInst.connect(addr1).MintNode("2")).to.ok;
        expect(await NodeInst.connect(addr1).checkRawReward("0")).to.ok;

        for (let index = 0; index < 2000; index++) {
            await network.provider.send("evm_increaseTime", [86400])
            await ethers.provider.send('evm_mine');
        
        } 
        /// tresury must approve
        expect(await Token.approve(NodeInst.address,"115792089237316195423570985008687907853269984665640564039457584007913129639935")).ok;
        expect(await DAI.approve(NodeInst.address, "115792089237316195423570985008687907853269984665640564039457584007913129639935")).ok;        

        expect(await NodeInst.connect(addr1).balanceOf(addr1.address)).to.eq("3");
        expect(await NodeInst.connect(addr1).MaintenanceAll("0")).to.ok;
        //var before = await Token.balanceOf(addr1.address);
        //var beforeDAI = await DAI.balanceOf(addr1.address);
        expect(await NodeInst.connect(addr1).CompoundAll()).to.ok;
        expect(await NodeInst.connect(addr1).balanceOf(addr1.address)).to.eq("6");
        //expect(await Token.balanceOf(addr1.address)).to.gt(before);    
        //expect(await DAI.balanceOf(addr1.address)).to.gt(beforeDAI);
    });
*/

        it("Test upfront maintain", async function () {

            const saphireGem = {
      LastMint: "0",
      MaintenanceFee: "10",
      RewardRate: "10",
      DailyLimit: "5",
      MintCount: "0",
      DefoPrice: ethers.utils.parseEther("10"),
      StablePrice : ethers.utils.parseEther("10")
    }
    const rubyGem = {
      LastMint: "0",
      MaintenanceFee: "100",
      RewardRate: "10",
      DailyLimit: "5",
      MintCount: "0",
      DefoPrice: ethers.utils.parseEther("100"),
      StablePrice : ethers.utils.parseEther("100")
    }
    const diamondGem = {
      LastMint: "0",
      MaintenanceFee: "1000",
      RewardRate: "10",
      DailyLimit: "5",
      MintCount: "0",
      DefoPrice: ethers.utils.parseEther("1000"),
      StablePrice :  ethers.utils.parseEther("1000")
    }
        
        expect(await OwnerFacet.setGemSettings("0", saphireGem)).to.ok;
        expect(await OwnerFacet.setGemSettings("1", rubyGem)).to.ok;
        expect(await OwnerFacet.setGemSettings("2", diamondGem)).to.ok;
                      
        expect(await GemFacet.connect(addr1).MintGem("0")).to.ok;
        expect(await GemFacet.connect(addr1).MintGem("1")).to.ok;
        expect(await GemFacet.connect(addr1).MintGem("2")).to.ok;
        expect(await GemFacet.connect(addr1).checkPendingMaintenance("0")).to.eq("0");
        for (let index = 0; index < 100; index++) {
            await network.provider.send("evm_increaseTime", [86400])
            await ethers.provider.send('evm_mine');
        
      }
        var before = await GemFacet.connect(addr1).checkPendingMaintenance("0")
        expect(await GemFacet.connect(addr1).Maintenance("0" , "200") ).to.ok;
        expect(await GemFacet.connect(addr1).checkPendingMaintenance("0")).to.lt(before);
        for (let index = 0; index < 100; index++) {
            await network.provider.send("evm_increaseTime", [86400])
            await ethers.provider.send('evm_mine');
        
      }
        expect(await GemFacet.connect(addr1).checkPendingMaintenance("0")).to.eq("0");


        });
    

    it("Test taper", async function () {
  
        expect(await GemFacet.connect(addr1).MintGem("0")).to.ok;
        expect(await GemFacet.connect(addr1).MintGem("1")).to.ok;
        expect(await GemFacet.connect(addr1).MintGem("2")).to.ok;

                    const saphireGem = {
      LastMint: "0",
      MaintenanceFee: "0",
      RewardRate: "1",
      DailyLimit: "5",
      MintCount: "0",
      DefoPrice: ethers.utils.parseEther("1000"),
      StablePrice : ethers.utils.parseEther("1000")
    }
    const rubyGem = {
      LastMint: "0",
      MaintenanceFee: "0",
      RewardRate: "10",
      DailyLimit: "5",
      MintCount: "0",
      DefoPrice: ethers.utils.parseEther("100"),
      StablePrice : ethers.utils.parseEther("100")
    }
    const diamondGem = {
      LastMint: "0",
      MaintenanceFee: "0",
      RewardRate: "10",
      DailyLimit: "5",
      MintCount: "0",
      DefoPrice: ethers.utils.parseEther("1000"),
      StablePrice :  ethers.utils.parseEther("1000")
    }
        
        expect(await OwnerFacet.setGemSettings("0", saphireGem)).to.ok;
        expect(await OwnerFacet.setGemSettings("1", rubyGem)).to.ok;
        expect(await OwnerFacet.setGemSettings("2", diamondGem)).to.ok;


        expect(await GemFacet.connect(addr1).checkRawReward("0")).to.ok;

        for (let index = 0; index < 2001; index++) {
            await network.provider.send("evm_increaseTime", [86400])
            await ethers.provider.send('evm_mine');
        
        }
        console.log(await GemFacet.checkTaperedReward("0"));
        console.log(await GemFacet.connect(addr1).checkRawReward("0"));
        expect(await GemFacet.checkTaperedReward("0")).to.lt(await GemFacet.checkRawReward("0"));

    });
  


});
