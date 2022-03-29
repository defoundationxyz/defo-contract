const { expect } = require("chai");
const { ethers } = require("hardhat");
const { expectRevert } = require('@openzeppelin/test-helpers');
const Table = require("cli-table3");

const wait = ms => new Promise(res => setTimeout(res, ms));

describe("Deploying Contracts", function () {

  let defoOwner, wAVAXOwner,factoryOwner, feeFactory, routerAddy, acc4, acc5, table;
  let defo, joeERC20, wAVAX, joeFactory, joePair, joeRouter, lpManager;
  beforeEach(async function()  {
    table = new Table({
      head:['Contracts', 'contract addresses'],
      colWidths:['auto','auto']
    });

    [defoOwner, wAVAXOwner, factoryOwner, feeFactory, routerAddy, acc4, acc5] = await ethers.getSigners();
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
      const _swapTokensToLiquidityThreshold= "1000000000000000000000";
      lpManager = await LpManager.deploy(joeRouter.address,[defo.address, joeERC20.address], _swapTokensToLiquidityThreshold);
      await lpManager.deployed();
    
      table.push(
        ['Defo token deployed at:', defo.address],
        ["Joe token deployed at:", joeERC20.address],
        ["WAVAX deployed at:", wAVAX.address],
        ["WAVAX owner is: ", wAVAXOwner.address],
        ["JoeFactory deployed at:", joeFactory.address],
        ["Joe Pair deployed at:", joePair.address],
        ["Factory owner is: ", factoryOwner.address],
        ["Joe Router deployed at:", joeRouter.address],
        ["LpManager deployed to:", lpManager.address],
      );
      console.log(table.toString());

  
  });
  it("Defo/Joe Lp pair ", async function () {
      table = new Table({
        head:['Test', 'Result'],
        colWidths:['auto','auto']
      });
    // await joeFactory.createPair(defo.address, joeERC20.address);
      const LpAddress = await lpManager.getPair();
      const routerAddress = await lpManager.getRouter();
      const isPair = await lpManager.isPair(LpAddress);
      const isLiquidityAdded = await lpManager.isLiquidityAdded(); 
      expect (await lpManager.getLeftSide()).to.equal((defo.address).toString());
      expect (await lpManager.getRightSide()).to.equal((joeERC20.address).toString());
      expect (isLiquidityAdded.toString()).to.equal("false");
      expect (isPair.toString()).to.equal("true");
  
      table.push(
        ['Router Address', routerAddress],
        ['DEFO/JOE address', LpAddress],
        ['Is Pair: ', isPair],
        ['isLiquidityAdded', isLiquidityAdded]
      );

      console.log(table.toString())
    // const pairAddress = await joeFactory.getPair(joeERC20.address, defo.address); 
    // const factoryAddy = await joeRouter.factory(); 
    // console.log("Pair address: " + pairAddress +" Factory address: " + factoryAddy)
  });
});
