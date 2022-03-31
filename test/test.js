const { expect } = require("chai");
const { ethers } = require("hardhat");
const { expectRevert } = require('@openzeppelin/test-helpers');
const Table = require("cli-table3");

const wait = ms => new Promise(res => setTimeout(res, ms));

describe("Deploying Contracts", function () {

  let defoOwner, wAVAXOwner,factoryOwner, feeFactory, routerAddy, acc1, acc2, acc3, table, table1, swapTokensToLiquidityThreshold;
  let defo, joeERC20, wAVAX, joeFactory, joePair, joeRouter, lpManager;
  table = new Table({
    head:['Contracts', 'contract addresses'],
    colWidths:['auto','auto']
  });
  beforeEach(async function()  {

    [defoOwner, wAVAXOwner, factoryOwner, feeFactory, routerAddy, acc1, acc2, acc3] = await ethers.getSigners();
      // deploying defo contract
      const Defo = await hre.ethers.getContractFactory("Defo");
      defo = await Defo.deploy(defoOwner.address);
      await defo.deployed();

      //deploying joeTrader contract 
      const JoeERC20 = await hre.ethers.getContractFactory("JoeERC20");
      joeERC20 = await JoeERC20.deploy();
      await joeERC20.deployed();
    
      //deploying Wavax contract
      const WAVAX = await hre.ethers.getContractFactory("WAVAX");
      wAVAX = await WAVAX.deploy(wAVAXOwner.address);
      await wAVAX.deployed();
    
      //deploying Joe factory contract
      const JoeFactory = await hre.ethers.getContractFactory("JoeFactory");
      joeFactory = await JoeFactory.deploy(feeFactory.address);
      await joeFactory.deployed();
    
      //deploying Joe Pair contract
      const JoePair = await hre.ethers.getContractFactory("JoePair");
      joePair = await JoePair.deploy();
      await joePair.deployed({from:factoryOwner.address});
    
      //deploying Joe Router contract
      const JoeRouter = await hre.ethers.getContractFactory("JoeRouter02");
      joeRouter = await JoeRouter.deploy(joeFactory.address, wAVAX.address);
      await joeRouter.deployed();
    
      //deploying Lp manager
      const LpManager = await hre.ethers.getContractFactory("LpManager");
      swapTokensToLiquidityThreshold= "100000000000000000000";//100 tokens
      lpManager = await LpManager.deploy(joeRouter.address, [defo.address, joeERC20.address], swapTokensToLiquidityThreshold);
      await lpManager.deployed();
      const uaddy = await lpManager.getUniverseImplementation();
      table.push(
        ['Defo token deployed at:', defo.address],
        ["Defo owner is: ", defoOwner.address],
        ["Joe token deployed at:", joeERC20.address],
        ["Joe owner is: ", defoOwner.address],
        ["WAVAX deployed at:", wAVAX.address],
        ["WAVAX owner is: ", wAVAXOwner.address],
        ["JoeFactory deployed at:", joeFactory.address],
        ["Joe Pair deployed at:", joePair.address],
        ["Factory owner is: ", factoryOwner.address],
        ["Joe Router deployed at:", joeRouter.address],
        ["LpManager deployed at:", lpManager.address], 
        ["Universal Implementation: ", uaddy],
      );
      //console.log(table.toString());
     
  });
  it("Contracts ", async function(){
    console.log(table.toString());
  })

  it("Defo/Joe Lp pair ", async function () {
      table1 = new Table({
        head:["Defo/Joe Lp Pair's Test", 'Result'],
        colWidths:['auto','auto']
      });
      //Checking Non-existent lp pair 
      const noLpToken = await joeFactory.getPair(wAVAX.address, joeERC20.address);
      //Pair created by LpManager contract
      const LpAddressByJoe =  await joeFactory.getPair(defo.address, joeERC20.address);
      const LpAddress = await lpManager.getPair();
      const isPair = await lpManager.isPair(LpAddress);
      const routerAddress = await lpManager.getRouter();
      const isLiquidityAdded = await lpManager.isLiquidityAdded();
      //Trying to create a already existing pair via JoeFactory contract
      await expectRevert(joeFactory.createPair(defo.address, joeERC20.address),"Joe: PAIR_EXISTS");
      await expectRevert(joeFactory.createPair(joeERC20.address, defo.address),"Joe: PAIR_EXISTS");
      expect (noLpToken.toString()).to.equal("0x0000000000000000000000000000000000000000");
      expect (routerAddress).to.equal(joeRouter.address);
      expect (await lpManager.getLeftSide()).to.equal((defo.address).toString());
      expect (await lpManager.getRightSide()).to.equal((joeERC20.address).toString());
      expect (isLiquidityAdded.toString()).to.equal("false");
      expect (isPair.toString()).to.equal("true");
      const uaddy = await lpManager.getUniverseImplementation();
      
      // const voidAddy = await voidSigner.address();
      //const provider = await ethers.getDefaultProvider();
      //const signer = await new ethers.VoidSigner( uaddy, provider);
      await lpManager.connect(uaddy).afterTokenTransfer(acc1.address);
     console.log(provider)
      table1.push(
        ['Router Address: ', routerAddress],
        ['DEFO/JOE Address: ', LpAddress],
        ['DEFO/JOE address by Joefactory: ', LpAddressByJoe],
        ['Is Pair: ', isPair],
        ['Is Liquidity Added: ', isLiquidityAdded],
        ['No existed token (WAVAX/Joe): ', noLpToken],    
        ["Universal Implementation: ", uaddy], 
        );
      console.log(table1.toString());
  });

  it("Adding liquidity", async function(){
    const uaddy = await lpManager.getUniverseImplementation();
    table1 = new Table({
      head:["Adding Liquidity's Test", 'Result'],
      colWidths:['auto','auto']
    });
   
    //Checking swapTokensToLiquidityThreshold
    const thresholdValue = (await lpManager.swapTokensToLiquidityThreshold()/1e18).toString();
    expect (thresholdValue).to.equal((swapTokensToLiquidityThreshold/1e18).toString());
    
    const tokenAccOne = "1000000000000000000000";//1000 defoTokens
    await defo.connect(defoOwner).transfer(acc1.address, tokenAccOne);
    const accOneBalanceDefo = (await defo.balanceOf(acc1.address)/1e18).toString();
    expect (accOneBalanceDefo.toString()).to.equal((tokenAccOne/1e18).toString())
    expect (await defo.connect(acc1).approve(lpManager.address, tokenAccOne)).to.ok;
    //await lpManager.connect(acc1).afterTokenTransfer(acc1.address)
    //current lp balance
    // await lpManager.connect(uaddy).afterTokenTransfer(acc1.address)
    //const provider = await ethers.getDefaultProvider()
     const uaddy1 = await lpManager.getUniverseImplementation();
    //const lpBalance = await lpManager.pairLiquidityTotalSupply();
    console.log(uaddy1)
    table1.push(
      ['Swap Threshold Tokens: ', thresholdValue],
      ['Account One Defo balance', tokenAccOne ],
      ["Universal Implementation: ", uaddy], 
    )
    console.log(table1.toString());
  });
   
});
