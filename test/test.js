const { expect } = require("chai");
const { ethers } = require("hardhat");
const { expectRevert } = require('@openzeppelin/test-helpers');
const Table = require("cli-table3");


describe("Deploying Contracts", function () {

  let defoOwner, wAVAXOwner,factoryOwner, feeFactory, routerAddy, testToken, acc1, lpOwner, acc2, acc3, table, table1, swapTokensToLiquidityThreshold;
  let defo, joeERC20, wAVAX, joeFactory, joePair, joeRouter, lpManager;
  table = new Table({
    head:['Contracts', 'contract addresses'],
    colWidths:['auto','auto']
  });
  beforeEach(async function()  {

    [defoOwner, wAVAXOwner, factoryOwner, feeFactory, routerAddy, testTokenOwner, acc1, acc2, acc3] = await ethers.getSigners();
      // deploying defo contract
      const Defo = await hre.ethers.getContractFactory("Defo");
      defo = await Defo.deploy(defoOwner.address);

      //deploying joeTrader contract 
      const JoeERC20 = await hre.ethers.getContractFactory("JoeERC20");
      joeERC20 = await JoeERC20.deploy();

      //deploying testToken contract
      const TestToken = await hre.ethers.getContractFactory("TestToken");
      testToken = await TestToken.deploy(testTokenOwner.address);
    
      //deploying Wavax contract
      const WAVAX = await hre.ethers.getContractFactory("WAVAX");
      wAVAX = await WAVAX.deploy(wAVAXOwner.address);
    
      //deploying Joe factory contract
      const JoeFactory = await hre.ethers.getContractFactory("JoeFactory");
      joeFactory = await JoeFactory.connect(factoryOwner).deploy(feeFactory.address);
    
      //deploying Joe Pair contract
      // const JoePair = await hre.ethers.getContractFactory("JoePair");
      // joePair = await JoePair.connect(acc1).deploy();
    
      //deploying Joe Router contract
      const JoeRouter = await hre.ethers.getContractFactory("JoeRouter02");
      joeRouter = await JoeRouter.deploy(joeFactory.address, wAVAX.address);

      //deploying Lp manager
      const LpManager = await hre.ethers.getContractFactory("LpManager");
      swapTokensToLiquidityThreshold= "100000000000000000000";//100 tokens
      lpManager = await LpManager.deploy(joeRouter.address, [defo.address, testToken.address], swapTokensToLiquidityThreshold);
      //This address should be equal to 
      const uaddy = await lpManager.getUniverseImplementation();
    
      
      table.push(
        ['Defo token deployed at:', defo.address],
        ["Defo owner is: ", defoOwner.address],
        ["Joe token deployed at:", joeERC20.address],
        ["Joe owner is: ", defoOwner.address],
        ["TestToken deployed at: " , testToken.address],
        ["TestToken Owner: " , testTokenOwner.address ],
        ["WAVAX deployed at:", wAVAX.address],
        ["WAVAX owner is: ", wAVAXOwner.address],
        ["JoeFactory deployed at:", joeFactory.address],
        //["Joe Pair deployed at:", joePair.address],
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

  it("Defo/TT Lp pair ", async function () {
      table1 = new Table({
        head:["Defo/TT Lp Pair's Test", 'Result'],
        colWidths:['auto','auto']
      });

      // const lpContract = await joeFactory.connect(acc1).createPair(defo.address, testToken.address);
      // const lpAddress = await joeFactory.getPair(defo.address, testToken.address)
      // const reserves =  await lpContract.getReserves();
      // console.log(reserves)
      const uaddy = await lpManager.getUniverseImplementation();

      //Checking Non-existent lp pair. @note this would be 0x0
      const noLpToken = await joeFactory.getPair(wAVAX.address, joeERC20.address);

      //Pair created by LpManager contract.
      const LpAddressByJoe =  await joeFactory.getPair(defo.address, testToken.address);
      const LpAddress = await lpManager.getPair();
      const isPair = await lpManager.isPair(LpAddress);
      const routerAddress = await lpManager.getRouter();
      const isLiquidityAdded = await lpManager.isLiquidityAdded();

      //Trying to create a already existing pair via JoeFactory contract
      await expectRevert(joeFactory.createPair(defo.address, testToken.address),"Joe: PAIR_EXISTS");
      await expectRevert(joeFactory.createPair(testToken.address, defo.address),"Joe: PAIR_EXISTS");
      expect (noLpToken.toString()).to.equal("0x0000000000000000000000000000000000000000");
      expect (routerAddress).to.equal(joeRouter.address);
      expect (await lpManager.getLeftSide()).to.equal((defo.address).toString());
      expect (await lpManager.getRightSide()).to.equal((testToken.address).toString());
      expect (isLiquidityAdded.toString()).to.equal("false");
      expect (isPair.toString()).to.equal("true");

      //Checking swapTokensToLiquidityThreshold
      const thresholdValue = (await lpManager.swapTokensToLiquidityThreshold()/1e18).toString();
      expect (thresholdValue).to.equal((swapTokensToLiquidityThreshold/1e18).toString());
      
      //transfering defo and test token to acc1 
      const tokenAccOneDecimals = "1000000000000000000000";
      //Transfering defo
      await defo.connect(defoOwner).transfer(acc1.address, tokenAccOneDecimals);
      const accOneBalanceDefo = (await defo.balanceOf(acc1.address)/1e18);
      expect (accOneBalanceDefo.toString()).to.equal((tokenAccOneDecimals/1e18).toString()).to.ok;
      await defo.connect(acc1).approve(joeRouter.address, tokenAccOneDecimals);

      //transfering TT
      await testToken.connect(testTokenOwner).transfer(acc1.address, tokenAccOneDecimals);
      const accOneBalanceTT = (await testToken.balanceOf(acc1.address)/1e18);
      expect (accOneBalanceTT.toString()).to.equal((tokenAccOneDecimals/1e18).toString()).to.ok;
      await testToken.connect(acc1).approve(joeRouter.address, tokenAccOneDecimals);
      const factoryAddressViaRouter = await joeRouter.factory();
      // const factoryAddressViaPair = await joePair.factory();
      // console.log(factoryAddressViaPair)
      const liquidtyToken = "1000000000000000000000"
      const minimumToken =  "990000000000000000000";
      // //adding liquidity
      // //await lpManager.connect(lpOwner).shouldLiquify(true);
      const liquifyingStaus = await lpManager.liquifyEnabled();
      // //@notice @dev currently getting the err: Transaction reverted: function call to a non-contract account.
      // //Reminder for noRush, have checked all possible scenarios. No solution yet. Will work on it afterwards. 
      //  await joeRouter.connect(acc1).addLiquidity
      // ( defo.address, testToken.address,
      //   liquidtyToken, liquidtyToken,
      //   minimumToken, minimumToken,
      //   acc1.address, "1649208482"// update this with current epoch
      //  )

      table1.push(
        ['Router Address: ', routerAddress],
        ['DEFO/TestToken Address: ', LpAddress],
        ['DEFO/TestToken address by Joefactory: ', LpAddressByJoe],
        ['Is Pair: ', isPair],
        ['Is Liquidity Added: ', isLiquidityAdded],
        ['No existed token (WAVAX/Joe): ', noLpToken],
        ["defo address: ", defo.address],
        ["Universal Implementation: ", uaddy],
        ['Account 1 Defo balance: ', accOneBalanceDefo ],
        ['Account 1 TT balance: ', accOneBalanceTT ],
        ['factory address: ', joeFactory.address ],
        ['liquifying status: ', liquifyingStaus]
        );
        // const fact = await joeRouter.factory();
        // console.log(fact)
      console.log(table1.toString());
  });
});
