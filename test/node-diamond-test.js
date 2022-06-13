const { expect } = require("chai");
const { ethers } = require("hardhat");
//const { BigNumber } = require("ethers");;
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
  let NodeLimiterFacet
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
      NodeLimiterFacet = await ethers.getContractAt('NodeLimiterFacet', diamondAddress);
    [owner, addr1, addr2, addr3, ...addrs] = await ethers.getSigners();

    Token = await mockToken.deploy();
    DAI = await mockToken.deploy();

    expect(await OwnerFacet.initialize(owner.address, Token.address, DAI.address, owner.address, diamondAddress, owner.address, owner.address)).to.ok;
    expect(await ERC721Facet.initialize("Defo Node" , "DFN")).to.ok;
      
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
    expect(await OwnerFacet.setAddressAndDistTeam(owner.address, 75, 75)).to.ok;    
    expect(await OwnerFacet.setAddressAndDistLiquidity(owner.address ,0 , 0)).to.ok;    

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

    it("Test redeem Booster", async function () {
        expect(await GemFacet.RedeemMintBooster("0" , "2", addr1.address)).to.ok;
        expect(await GemFacet.RedeemMint("0", addr1.address)).to.ok;
        expect(await GemFacet.connect(addr1).BoostGem("2", "0")).to.ok;
        expect(await GemFacet.connect(addr1).BoostGem("2", "1")).to.ok;
      await expect(GemFacet.connect(addr1).BoostGem("2", "1")).to.be.reverted 
      
        expect(await GemFacet.RedeemMintBooster("0" , "1", addr1.address)).to.ok;
        expect(await GemFacet.RedeemMint("0", addr1.address)).to.ok;
        expect(await GemFacet.connect(addr1).BoostGem("1", "2")).to.ok;
        expect(await GemFacet.connect(addr1).BoostGem("1", "3")).to.ok;
        await expect(GemFacet.connect(addr1).BoostGem("1", "3")).to.be.reverted 

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
      expect(await GemFacet.connect(addr1).Maintenance("0", "0")).to.ok;
      expect(await GemFacet.connect(addr1).Maintenance("1", "0")).to.ok;
      expect(await GemFacet.connect(addr1).Maintenance("2" , "0")).to.ok;
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
              expect(await GemFacet.connect(addr1).Maintenance("0", "0")).to.ok;
        expect(await GemFacet.connect(addr1).Maintenance("1", "0")).to.ok;
        expect(await GemFacet.connect(addr1).Maintenance("2" , "0")).to.ok;
        expect(await GemFacet.connect(addr1).ClaimRewards("0")).to.ok;

    });
  
      it("Test vault", async function () {

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
        expect(await OwnerFacet.setAddressVault(addr2.address)).to.ok;
        expect(await Token.approve(diamondAddress, "100000000000000000000000")).ok;
        expect(await DAI.approve(diamondAddress, "100000000000000000000000")).ok;     
          
        expect(await Token.connect(addr2).approve(diamondAddress, "100000000000000000000000")).ok;
        expect(await DAI.connect(addr2).approve(diamondAddress, "100000000000000000000000")).ok;   
        /// expect revert 
        //expect(await NodeInst.connect(addr1).ClaimRewardsAll()).to.ok;
        expect(await GemFacet.connect(addr1).Maintenance("0", "0")).to.ok;
        expect(await GemFacet.connect(addr1).Maintenance("1", "0")).to.ok;
        expect(await GemFacet.connect(addr1).Maintenance("2", "0")).to.ok;
        let pendingReward = await GemFacet.checkTaperedReward("0");
        expect(await VaultStakingFacet.connect(addr1).showStakedAmount()).to.eq("0");
        expect(await VaultStakingFacet.connect(addr1).addToVault("0", pendingReward)).to.ok;
        expect(await VaultStakingFacet.connect(addr1).showStakedAmount()).to.eq(pendingReward);
        expect(await VaultStakingFacet.connect(addr1).removeFromVault("0" , pendingReward)).to.ok;
        expect(await VaultStakingFacet.connect(addr1).showStakedAmount()).to.eq(0);
        expect(await GemFacet.checkTaperedReward("0")).to.lt(pendingReward)

    });
  
        it("Test batch vault", async function () {

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
        expect(await OwnerFacet.setAddressVault(addr2.address)).to.ok;
        expect(await Token.approve(diamondAddress, "100000000000000000000000")).ok;
        expect(await DAI.approve(diamondAddress, "100000000000000000000000")).ok;     
          
        expect(await Token.connect(addr2).approve(diamondAddress, "100000000000000000000000")).ok;
        expect(await DAI.connect(addr2).approve(diamondAddress, "100000000000000000000000")).ok;   
        /// expect revert 
        //expect(await NodeInst.connect(addr1).ClaimRewardsAll()).to.ok;
        expect(await GemFacet.connect(addr1).Maintenance("0", "0")).to.ok;
        expect(await GemFacet.connect(addr1).Maintenance("1", "0")).to.ok;
        expect(await GemFacet.connect(addr1).Maintenance("2", "0")).to.ok;
        let pendingReward0 = await GemFacet.checkTaperedReward("0");
        let pendingReward1 = await GemFacet.checkTaperedReward("1");
        let pendingReward2 = await GemFacet.checkTaperedReward("2");
        
        expect(await VaultStakingFacet.connect(addr1).showStakedAmount()).to.eq("0");
        expect(await VaultStakingFacet.connect(addr1).batchAddToVault(["0" , "1" , "2"], [pendingReward0 ,pendingReward1 , pendingReward2])).to.ok;
 //       expect(await VaultStakingFacet.connect(addr1).showStakedAmount()).to.eq(pendingReward0 + pendingReward1 + pendingReward2);
        expect(await VaultStakingFacet.connect(addr1).removeFromVault("0" , pendingReward0)).to.ok;
 //       expect(await VaultStakingFacet.connect(addr1).showStakedAmount()).to.eq(pendingReward1 + pendingReward2);
        expect(await GemFacet.checkTaperedReward("0")).to.lt(pendingReward0)

    });
  
   
      it.only("Test vault bug", async function () {

        //expect(await NodeInst.setMinDaiReward("1")).to.ok;         
        expect(await GemFacet.connect(addr1).MintGem("0")).to.ok;

        for (let index = 0; index < 2; index++) {
            await network.provider.send("evm_increaseTime", [86400 * 365])
            await ethers.provider.send('evm_mine');
        
        } 
        /// tresury must approve
        expect(await OwnerFacet.setAddressVault(addr2.address)).to.ok;
        expect(await Token.approve(diamondAddress, "100000000000000000000000")).ok;
        expect(await DAI.approve(diamondAddress, "100000000000000000000000")).ok;     
          
        expect(await Token.connect(addr2).approve(diamondAddress, "100000000000000000000000")).ok;
        expect(await DAI.connect(addr2).approve(diamondAddress, "100000000000000000000000")).ok;   
        /// expect revert 
        //expect(await NodeInst.connect(addr1).ClaimRewardsAll()).to.ok;
        expect(await GemFacet.connect(addr1).Maintenance("0", "0")).to.ok;
        let pendingReward = await GemFacet.checkTaperedReward("0");
        expect(await VaultStakingFacet.connect(addr1).showStakedAmount()).to.eq("0");
        expect(await VaultStakingFacet.connect(addr1).addToVault("0", pendingReward)).to.ok;
        let gemval = await VaultStakingFacet.gemVaultAmount("0");
        expect(await VaultStakingFacet.connect(addr1).removeFromVault("0" , gemval)).to.ok;

    });
  
    it("Test reward tax", async function () {

        //expect(await NodeInst.setMinDaiReward("1")).to.ok;         
        expect(await GemFacet.connect(addr1).MintGem("0")).to.ok;
        expect(await GemFacet.connect(addr1).MintGem("1")).to.ok;
        expect(await GemFacet.connect(addr1).MintGem("2")).to.ok;
        expect(await GemFacet.connect(addr1).checkRawReward("0")).to.ok;

        for (let index = 0; index < 2; index++) {
            await network.provider.send("evm_increaseTime", [86400 * 2])
            await ethers.provider.send('evm_mine');
        
        } 
        /// tresury must approve
        expect(await Token.approve(diamondAddress, "100000000000000000000000")).ok;
        expect(await DAI.approve(diamondAddress, "100000000000000000000000")).ok;        
        /// expect revert 
        //expect(await NodeInst.connect(addr1).ClaimRewardsAll()).to.ok;
        expect(await GemFacet.connect(addr1).Maintenance("0", "0")).to.ok;
        expect(await GemFacet.connect(addr1).Maintenance("1", "0")).to.ok;
        expect(await GemFacet.connect(addr1).Maintenance("2", "0")).to.ok;
        let rewardBeforeTax = await GemFacet.checkTaperedReward("0");
        expect(await GemFacet.connect(addr1).checkTaxedReward("0")).to.lt(rewardBeforeTax);
        expect(await GemFacet.connect(addr1).ClaimRewards("0")).to.ok;

    });

      it("Test check tax after reward", async function () {

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
        expect(await GemFacet.connect(addr1).Maintenance("0", "0")).to.ok;
        expect(await GemFacet.connect(addr1).Maintenance("1", "0")).to.ok;
        expect(await GemFacet.connect(addr1).Maintenance("2" , "0")).to.ok;
        expect(await GemFacet.connect(addr1).ClaimRewards("0")).to.ok;
        expect(await GemFacet.connect(addr1).checkTaxedReward("0")).to.ok;
        //expect(await GemFacet.connect(addr1).checkTaperedReward("0")).to.ok;

    });

      it("Test min claim time", async function () {

        //expect(await NodeInst.setMinDaiReward("1")).to.ok;         
        expect(await GemFacet.connect(addr1).MintGem("0")).to.ok;
        expect(await GemFacet.connect(addr1).MintGem("1")).to.ok;
        expect(await GemFacet.connect(addr1).MintGem("2")).to.ok;
        expect(await GemFacet.connect(addr1).checkRawReward("0")).to.ok;
        expect(await OwnerFacet.setMinRewardTime(3600 * 24 * 7)).to.ok;
        for (let index = 0; index < 2; index++) {
            await network.provider.send("evm_increaseTime", [3600 * 24])
            await ethers.provider.send('evm_mine');
        
        } 
        /// tresury must approve
        expect(await Token.approve(diamondAddress, "100000000000000000000000")).ok;
        expect(await DAI.approve(diamondAddress, "100000000000000000000000")).ok;        
        /// expect revert 
      
        let rewardBeforeTax = await GemFacet.checkTaperedReward("0");
        expect(await GemFacet.connect(addr1).checkTaxedReward("0")).to.lt(rewardBeforeTax);
        await expect(GemFacet.connect(addr1).ClaimRewards("0")).to.be.reverted


      });
  
  it("Test mintlimit", async function () {
            const saphireGem = {
      LastMint: "0",
      MaintenanceFee: "0",
      RewardRate: "10",
      DailyLimit: "3",
      MintCount: "0",
      DefoPrice: ethers.utils.parseEther("10"),
      StablePrice : ethers.utils.parseEther("10")
            }
    expect(await OwnerFacet.setGemSettings("0", saphireGem)).to.ok;
    expect(await OwnerFacet.setMintLimitHours("7")).to.ok;
    
        for (let index = 0; index < 3; index++) {
          expect(await GemFacet.connect(addr1).MintGem("0")).to.ok;
        }
        await expect(GemFacet.connect(addr1).MintGem("0")).to.be.reverted 
        await network.provider.send("evm_increaseTime", [3600 * 7])
        await ethers.provider.send('evm_mine');
    
    expect(await GemFacet.connect(addr1).MintGem("0")).to.ok;
        //expect(await Token.balanceOf(addr1.address)).to.eq(before - 1110);    
        //expect(await DAI.balanceOf(addr1.address)).to.eq(beforeDAI- 1110);
    });
  
    it("Test gemGetter", async function () {
        expect(await GettersFacet.GemOf("0")).to.ok;
        expect(await GettersFacet.GetGemTypeMetadata("0")).to.ok;
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
  
    it("Test isActive", async function () {
  
        expect(await GemFacet.connect(addr1).MintGem("0")).to.ok;
        expect(await GemFacet.connect(addr1).MintGem("1")).to.ok;
        expect(await GemFacet.connect(addr1).MintGem("2")).to.ok;
        expect(await GemFacet.connect(addr1).isActive("0")).to.eq(true);

    });
  
  it("Test Node limiter", async function () {

    expect(await OwnerFacet.ToggleTransferLock())
    expect(await OwnerFacet.setLimiterAddress(diamondAddress))
    expect(await NodeLimiterFacet.addToWhitelist("0x0000000000000000000000000000000000000000"))
    expect(await GemFacet.connect(addr1).MintGem("0")).to.ok;
    await expect(ERC721Facet.connect(addr1)["safeTransferFrom(address,address,uint256)"](addr1.address, addr2.address, 0)).to.be.reverted 
  });

    it("Test getGemIdsOf ", async function () {
  
    expect(await GemFacet.connect(addr1).MintGem("0")).to.ok;
    expect(await GemFacet.connect(addr1).MintGem("0")).to.ok;
    let ids = await GemFacet.connect(addr1).getGemIdsOf(addr1.address)
    let expected = [ethers.BigNumber.from("0"), ethers.BigNumber.from("1"), ethers.BigNumber.from("2")];
        for (let index = 0; index < ids.length; index++) {
          const element = ids[index];
          expect(ids[index]).to.eq(expected[index]);
        }
      
  });
  
   // TODO: please
    /*it("Test getGemIdsOfWithType", async function () {
  
    expect(await GemFacet.connect(addr1).MintGem("0")).to.ok;
    expect(await GemFacet.connect(addr1).MintGem("0")).to.ok;
    expect(await GemFacet.connect(addr1).MintGem("1")).to.ok;
    expect(await GemFacet.connect(addr1).MintGem("2")).to.ok;
    let ids = await GemFacet.connect(addr1).getGemIdsOfWithType(addr1.address , "0")
    let expected = [ethers.BigNumber.from("0"), ethers.BigNumber.from("1")];
        for (let index = 0; index < ids.length; index++) {
          const element = ids[index];
          expect(ids[index]).to.eq(expected[index]);
        }
      
    });
    */
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
        expect(await GemFacet.connect(addr1).Maintenance("0", "0")).to.ok;
        expect(await GemFacet.connect(addr1).Maintenance("1", "0")).to.ok;
        expect(await GemFacet.connect(addr1).Maintenance("2" , "0")).to.ok;
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
        expect(await OwnerFacet.setTaperRate("80")).to.ok; 
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
