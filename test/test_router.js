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
    defo = await Defo.deploy(defoOwner.address);

    //deploying testToken contract
    const TestToken = await hre.ethers.getContractFactory("TestToken");
    testToken = await TestToken.deploy(testTokenOwner.address);

    //deploying Wavax contract
    const WAVAX = await hre.ethers.getContractFactory("WAVAX");
    wAVAX = await WAVAX.deploy(wAVAXOwner.address);
        
    //deploying Lp manager
    const LpManager = await hre.ethers.getContractFactory("LpManager");
    swapTokensToLiquidityThreshold= "100000000000000000000";//100 tokens
    lpManager = await LpManager.deploy(routerAddress, treasury.address, [defo.address, testToken.address], swapTokensToLiquidityThreshold);
    defoTtAddress = await lpManager.getPair();
    //This address should be equal to 
    const uaddy = await lpManager.getUniverseImplementation();
    
    table.push(
        ['Defo token deployed at:', defo.address],
        ["Defo owner is: ", defoOwner.address],
        ["TestToken deployed at: " , testToken.address],
        ["TestToken Owner: " , testTokenOwner.address ],
        ["WAVAX Owner: " , wAVAX.address ],
        ["factory address: ", factoryAddress],
        ["LpManager deployed at:", lpManager.address],
        ["Lp address: ", defoTtAddress],
        ["Universal Implementation: ", uaddy],
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
    const thresholdValue = (await lpManager.swapTokensToLiquidityThreshold()/1e18).toString();
    expect (thresholdValue).to.equal((swapTokensToLiquidityThreshold/1e18).toString());
      
    //transfering defo and test token to acc1 
    const tokenAccOneDecimals = "1000000000000000000000"; //1000 tokens

    //Transfering and approving defo
    await defo.connect(defoOwner).transfer(acc1.address, tokenAccOneDecimals);
    const accOneBalanceDefo = (await defo.balanceOf(acc1.address)/1e18);
    expect (accOneBalanceDefo.toString()).to.equal((tokenAccOneDecimals/1e18).toString()).to.ok;
    await defo.connect(acc1).approve(routerAddress, tokenAccOneDecimals);

    //transfering TT
    await testToken.connect(testTokenOwner).transfer(acc1.address, tokenAccOneDecimals);
    const accOneBalanceTT = (await testToken.balanceOf(acc1.address)/1e18);
    expect (accOneBalanceTT.toString()).to.equal((tokenAccOneDecimals/1e18).toString()).to.ok;
    await testToken.connect(acc1).approve(routerAddress, tokenAccOneDecimals);
    
    //adding liquidity
    const liquidtyToken = "900000000000000000000" //1000 tokens
    const minimumToken =  "890000000000000000000"; //990 tokens
    await routerContract.connect(acc1).addLiquidity
    ( defo.address, testToken.address,
    liquidtyToken, liquidtyToken,
    minimumToken, minimumToken,
    acc1.address, "1649646004"// update this with current epoch
    )
    
    //checking Acc1 lp balance
    const lpBalance = await lpManager.connect(acc1).checkBalance();
    const balance = ethers.utils.formatUnits(lpBalance, 18);

    //Checking total Lp minted
    const lpLiquidity = await lpManager.getSupply();
    const lpLiquidityBalance = ethers.utils.formatUnits(lpLiquidity, 18);
    //const isLiquidityAddedAfter = await lpManager.isLiquidityAdded();
    console.log(lpLiquidityBalance)
      table.push(
         ['DEFO/TestToken Address: ', lpAddress],
         ["LpAdd Joe Factory check: ", checkBool],
         ['No existed token (WAVAX/defo): ', nonExistentAdd],
         ['Is Liquidity Added status before: ', isLiquidityAddedBefore],
         ['Account 1 Defo balance: ', accOneBalanceDefo ],
         ['Account 1 TT balance: ', accOneBalanceTT ],
         ['Lp Balance account 1: ', balance ],
         ['Liquidity balance: ', lpLiquidityBalance],
        );
    //     // const fact = await joeRouter.factory();
    //     // console.log(fact)
       console.log(table.toString());
  });
});
