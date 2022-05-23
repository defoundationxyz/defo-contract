/* global ethers */
/* eslint prefer-const: "off" */

const { ethers } = require('hardhat')
const hre = require("hardhat");
const { getSelectors, FacetCutAction } = require('./libraries/diamond.js')
const Table = require("cli-table3");
const { Contract, BigNumber } = require('ethers');
const DEFO_ABI = require("../abi/defo-abi.json");

const DEFO_TOKEN = "0x5C7ea2D484464a6Be1c2028CE1E9e1Ec339Dd3Ae";
const DAI_TOKEN = "0x85a2ff500E0eD9fA93719071EA46A86198181581";
const JOE_ROUTER_MAIN = "0x60aE616a2155Ee3d9A68541Ba4544862310933d4";

const formatBalance = (balance, decimals = 18) => Number(balance.div(BigNumber.from(10).pow(decimals)));

const saphireGem = {
	LastMint: "0",
	MaintenanceFee: "0",
	RewardRate: "10",
	DailyLimit: "5",
	MintCount: "0",
	DefoPrice: ethers.utils.parseEther("10"),
	StablePrice: ethers.utils.parseEther("10")
}
const rubyGem = {
	LastMint: "0",
	MaintenanceFee: "0",
	RewardRate: "10",
	DailyLimit: "5",
	MintCount: "0",
	DefoPrice: ethers.utils.parseEther("100"),
	StablePrice: ethers.utils.parseEther("100")
}
const diamondGem = {
	LastMint: "0",
	MaintenanceFee: "0",
	RewardRate: "10",
	DailyLimit: "5",
	MintCount: "0",
	DefoPrice: ethers.utils.parseEther("1000"),
	StablePrice: ethers.utils.parseEther("1000")
}



async function deployDiamond() {
	const table = new Table({
		head: ['Contracts', 'contract addresses'],
		colWidths: ['auto', 'auto']
	});

	// const provider = ethers.getDefaultProvider();

	const [deployer, team, ...restAccounts] = await ethers.getSigners();
	const provider = await deployer.provider;

	table.push(
		["deployer", deployer.address],
		["team", team.address]
	)
	
	// deploy tokens
	const MDefoToken = await ethers.getContractFactory("MockDEFO", deployer);
	const mDefoToken = await MDefoToken.deploy();
    await mDefoToken.mintTokens(deployer.address, ethers.utils.parseEther("9000000"));

	const MDaiToken = await ethers.getContractFactory("MockDAI", deployer);
	const mDaiToken = await MDaiToken.deploy();
    await mDaiToken.mintTokens(deployer.address, ethers.utils.parseEther("8000000"));

	table.push(
		["Mock DEFO Token", mDefoToken.address],
		["Mock DAI Token", mDaiToken.address],
	)

	// deploy DiamondCutFacet
	const DiamondCutFacet = await ethers.getContractFactory('DiamondCutFacet')
	const diamondCutFacet = await DiamondCutFacet.deploy()
	await diamondCutFacet.deployed()
	table.push(["DiamondCutFacet", diamondCutFacet.address]);

	// deploy Diamond
	const Diamond = await ethers.getContractFactory('Diamond')
	const diamond = await Diamond.deploy(deployer.address, diamondCutFacet.address)
	await diamond.deployed()
	table.push(["Diamond", diamond.address]);

	// deploy DiamondInit
	// DiamondInit provides a function that is called when the diamond is upgraded to initialize state variables
	// Read about how the diamondCut function works here: https://eips.ethereum.org/EIPS/eip-2535#addingreplacingremoving-functions
	const DiamondInit = await ethers.getContractFactory('DiamondInit')
	const diamondInit = await DiamondInit.deploy()
	await diamondInit.deployed()

	// deploy facets
	const FacetNames = [
		'DiamondLoupeFacet',
		'OwnershipFacet',
		'ERC721Facet',
		'ERC721EnumerableFacet',
		'GemFacet',
		'VaultStakingFacet',
		'GemGettersFacet',
		'OwnerFacet',
		'NodeLimiterFacet'
	]
	const cut = []
	for (const FacetName of FacetNames) {
		const Facet = await ethers.getContractFactory(FacetName)
		const facet = await Facet.deploy()
		await facet.deployed()
		table.push([FacetName, facet.address]);
		cut.push({
			facetAddress: facet.address,
			action: FacetCutAction.Add,
			functionSelectors: getSelectors(facet)
		})
	}

	// upgrade diamond with facets
	const diamondCut = await ethers.getContractAt('IDiamondCut', diamond.address)
	let tx
	let receipt
	// call to init function
	let functionCall = diamondInit.interface.encodeFunctionData('init')
	tx = await diamondCut.diamondCut(cut, diamondInit.address, functionCall)
	receipt = await tx.wait()
	if (!receipt.status) {
		throw Error(`Diamond upgrade failed: ${tx.hash}`)
	}
	console.log('Completed diamond cut')

	// //deploying lpManager contract.
	// const LPManager = await hre.ethers.getContractFactory("LpManager");
	// const bufferThreshold = "1000000000000000000000";
	// const lpManager = await LPManager.deploy(JOE_ROUTER_MAIN, [DEFO_TOKEN, DAI_TOKEN], bufferThreshold);
	// console.log("LpManager deployed: ", lpManager.address);


	const erc721Facet = await ethers.getContractAt("ERC721Facet", diamond.address);
	const ownerFacetInstance = await ethers.getContractAt('OwnerFacet', diamond.address);
	const gemGetterFacetInstance = await ethers.getContractAt("GemGettersFacet", diamond.address);
	const gemFacetInstance = await ethers.getContractAt("GemFacet", diamond.address);
	
	const avaxBalance = formatBalance(await provider.getBalance(deployer.address));
	table.push(["Deployer AVAX balance: ", avaxBalance]);

	const deployerDefoBalance = formatBalance(await mDefoToken.balanceOf(deployer.address));
	table.push(["Deployer DEFO balance: ", deployerDefoBalance]);


	// TODO: update with valid addresses
	// initialize diamondStorage
	await ownerFacetInstance.initialize(
		deployer.address,
		mDefoToken.address,
		mDaiToken.address,
		deployer.address,
		diamond.address,
		deployer.address,
		deployer.address
	)
	await erc721Facet.initialize("Defo Node", "DFN");

	await ownerFacetInstance.setAddressAndDistTeam(deployer.address, 75, 75);
    await ownerFacetInstance.setAddressAndDistLiquidity(deployer.address, 0, 0);

    await ownerFacetInstance.setRewardTax(["500", "300", "100", "0"]);
    await ownerFacetInstance.setGemSettings("0", saphireGem);
    await ownerFacetInstance.setGemSettings("1", rubyGem);
    await ownerFacetInstance.setGemSettings("2", diamondGem);
	
	await mDaiToken.approve(diamond.address, ethers.utils.parseEther( "100000000000000000000000"));
	await mDefoToken.approve(diamond.address, ethers.utils.parseEther( "100000000000000000000000"));

	// const gemMetaTx = await gemGetterFacetInstance.getMeta();
	console.log(table.toString());

	// const gemMeta = await gemGetterFacetInstance.GetGemTypeMetadata(0);
	// console.log('gemMeta before ', gemMeta);

	const mintGemTx = await gemFacetInstance.MintGem(1);

	const getGemIdsTx = await gemFacetInstance.getGemIdsOf(deployer.address);
	console.log('gemIds: ', getGemIdsTx);

	const gemMetaAfter = await gemGetterFacetInstance.GetGemTypeMetadata(1);
	console.log('gemMeta after: ', gemMetaAfter);

	return diamond.address
}

if (require.main === module) {
	deployDiamond()
		.then(() => process.exit(0))
		.catch(error => {
			console.error(error)
			process.exit(1)
		})
}

