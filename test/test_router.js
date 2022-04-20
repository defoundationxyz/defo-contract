const { expect } = require("chai");
const { ethers } = require("hardhat");
const { expectRevert } = require('@openzeppelin/test-helpers');
const Table = require("cli-table3");
const {router_abi, factory_abi} = require("../abi/router_abi");
const routerAddress = "0x60aE616a2155Ee3d9A68541Ba4544862310933d4"


describe("Deploying Contracts", function () {
  //const provider = new ethers.providers.JsonRpcProvider();
  let defoOwner, testToken, acc1, wAVAXOwner, treasury, acc2, acc3, routerContract, defoTtAddress, factoryAddress, swapTokensToLiquidityThreshold;
  let defo, lpManager;
  let table = new Table({
    head:['Contracts', 'contract addresses'],
    colWidths:['auto','auto']
  });
  beforeEach(async function()  {
    await ethers.provider.send("hardhat_reset",[{
                forking: {
                    jsonRpcUrl: "https://api.avax.network/ext/bc/C/rpc",
                    blockNumber: 2975762,
                },
            },
        ],
    );

    [defoOwner, testTokenOwner, treasury, wAVAXOwner, acc1, acc2, acc3] = await ethers.getSigners();
    //initating Router contract
    routerContract = await ethers.getContractAt(router_abi, routerAddress )
    factoryAddress = await routerContract.factory()
    
    // deploying defo contract
    const Defo = await hre.ethers.getContractFactory("Defo");
    defo = await Defo.deploy();

    //deploying testToken contract
    const TestToken = await hre.ethers.getContractFactory("TestToken");
    testToken = await TestToken.deploy(testTokenOwner.address);

    //deploying Wavax contract
    const WAVAX = await hre.ethers.getContractFactory("WAVAX");
    wAVAX = await WAVAX.deploy(wAVAXOwner.address);
        
    //deploying Lp manager
    const LpManager = await hre.ethers.getContractFactory("LpManager");
    swapTokensToLiquidityThreshold= "100000000000000000000";//100 tokens
    lpManager = await LpManager.deploy(routerAddress, treasury.address, [defo.address, testToken.address] /*, swapTokensToLiquidityThreshold*/);
    defoTtAddress = await lpManager.getPair();
    //This address should be equal to 
    //const uaddy = await lpManager.getUniverseImplementation();
    
    //set setLiquidityPoolManager with Lp manager address
    await defo.setLiquidityPoolManager(lpManager.address);
    const lpManagerViaDefo = await defo.lpPoolManager();
   
    table.push(
        ['Defo token deployed at:', defo.address],
        ["Defo owner is: ", defoOwner.address],
        ["TestToken deployed at: " , testToken.address],
        ["TestToken Owner: " , testTokenOwner.address ],
        ["WAVAX Owner: " , wAVAX.address ],
        ["factory address: ", factoryAddress],
        ["LpManager deployed at:", lpManager.address],
        ["Lp address: ", defoTtAddress],
       // ["Universal Implementation: ", uaddy],
        ["Router address: ", routerAddress],
        ["Lp Manager By defo", lpManagerViaDefo],
        ["reward pool address: ", treasury.address],
      );
    });

  it("Contracts ", async function(){
    console.log(table.toString());
  })

  it("Defo/TT Lp pair ", async function () {
    table = new Table({
    head:["Defo/TT Lp Pair's Test", 'Result'],
    colWidths:['auto','auto']
    });
    //initating Factory contract
    const joeFactory = await ethers.getContractAt(factory_abi, factoryAddress);
    const lpAddress = await joeFactory.getPair(defo.address, testToken.address);
    
    //@notice return 0x00 as pair doesn't exists
    const nonExistentAdd = await joeFactory.getPair(defo.address, wAVAX.address);

    //@notice check to see if Lp created by LpManager is same as in JoeFactory
    const checkBool = (lpAddress == defoTtAddress) ? "True" : "False";
    
    //Trying to create an already existing pair.
    await expectRevert( joeFactory.connect(acc1).createPair(defo.address, testToken.address),"Joe: PAIR_EXISTS");
    await expectRevert( joeFactory.connect(acc1).createPair(testToken.address, defo.address),"Joe: PAIR_EXISTS");
    
    //checking Lp Manager functions
    const isLiquidityAddedBefore = await lpManager.isLiquidityAdded();
    expect (await lpManager.getLeftSide()).to.equal((defo.address).toString());
    expect (await lpManager.getRightSide()).to.equal((testToken.address).toString());
    expect (isLiquidityAddedBefore.toString()).to.equal("false");
    
    //Checking swapTokensToLiquidityThreshold
    // const thresholdValue = (await lpManager.swapTokensToLiquidityThreshold()/1e18).toString();
    // expect (thresholdValue).to.equal((swapTokensToLiquidityThreshold/1e18).toString());
      
    //transfering defo and test token to acc1 
    const tokenAccOneDecimals = "2000000000000000000000"; //2000 tokens

    //Transfering and approving defo
    await defo.connect(defoOwner).transfer(acc1.address, tokenAccOneDecimals);
    const accOneBalanceDefo = ethers.utils.formatUnits (await defo.balanceOf(acc1.address), 18);
    expect (accOneBalanceDefo.toString()).to.equal(ethers.utils.formatUnits (tokenAccOneDecimals, 18).toString()).to.ok;
    await defo.connect(acc1).approve(routerAddress, tokenAccOneDecimals);

    //transfering TT
    await testToken.connect(testTokenOwner).transfer(acc1.address, tokenAccOneDecimals);
    const accOneBalanceTT = ethers.utils.formatUnits (await testToken.balanceOf(acc1.address), 18);
    expect (accOneBalanceTT.toString()).to.equal(ethers.utils.formatUnits (tokenAccOneDecimals, 18).toString()).to.ok;
    await testToken.connect(acc1).approve(routerAddress, tokenAccOneDecimals);
    
    //checking reward pool balance
    const rewardPoolBalanceBeforeLP = ethers.utils.formatUnits(await defo.balanceOf(treasury.address), 18);
    
    //adding liquidity
    const liquidtyToken = "1000000000000000000000" //1000 tokens
    const minimumToken =  "980000000000000000000"; //480 tokens
    await routerContract.connect(acc1).addLiquidity
    ( defo.address, testToken.address,
        liquidtyToken, liquidtyToken,
        minimumToken, minimumToken,
    acc1.address, "1649910829447"// update this with current epoch
    )
    
    //checking Acc1 lp, defo and test token balance
    const lpBalance = ethers.utils.formatUnits(await lpManager.connect(acc1).checkBalance(), 18);
    const accOneBalanceDefoAfter = ethers.utils.formatUnits (await defo.balanceOf(acc1.address), 18);
    const accOneBalanceTTAfter = ethers.utils.formatUnits (await testToken.balanceOf(acc1.address), 18);
    const rewardPoolBalanceAfterLP = ethers.utils.formatUnits(await defo.balanceOf(treasury.address), 18);

    //Checking total Lp minted
    const lpLiquidityBalance = ethers.utils.formatUnits(await lpManager.getSupply(), 18);

    //swapping token
    const amountToSwap = "100000000000000000000"; //100
    await routerContract.connect(acc1).swapExactTokensForTokens(
      amountToSwap, "0", [  defo.address, testToken.address], 
      acc1.address, "1649910829447"
    );

    //checking balance after swapping
    const accOneDefoBalanceAfterSwapping = ethers.utils.formatUnits (await defo.balanceOf(acc1.address), 18);
    const accOneTTBalanceAfterSwapping = ethers.utils.formatUnits (await testToken.balanceOf(acc1.address), 18);
    const rewardPoolBalanceAfter = ethers.utils.formatUnits(await defo.balanceOf(treasury.address), 18);

    table.push(
        ['DEFO/TestToken Address: ', lpAddress],
        ["LpAdd Joe Factory check: ", checkBool],
        ['No existed token (WAVAX/defo): ', nonExistentAdd],
        ['Is Liquidity Added status before: ', isLiquidityAddedBefore],
        ['Account 1 Defo balance: ', accOneBalanceDefo ],
        ['Account 1 TT balance: ', accOneBalanceTT ],
        ["Rewards balance before adding LP: ", rewardPoolBalanceBeforeLP],
        ['Lp Balance Account 1: ', lpBalance ],
        ['Total LP minted: ', lpLiquidityBalance],
        ['Account 1 Defo balance after adding LP: ', accOneBalanceDefoAfter ],
        ['Account 1 TT balance after adding LP: ', accOneBalanceTTAfter ],
        ['Reward pool balance after lp & before swap', rewardPoolBalanceAfterLP],
        ['Acc1 defo bal after swap: ', accOneDefoBalanceAfterSwapping],
        ['Acc1 TT bal after swap: ', accOneTTBalanceAfterSwapping],
        ['Reward Pool balance after swap: ', rewardPoolBalanceAfter],
    );
    console.log(table.toString());
  });

});