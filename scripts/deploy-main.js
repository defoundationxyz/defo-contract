/* global ethers */
/* eslint prefer-const: "off" */

const { ethers, network } = require('hardhat')
const hre = require("hardhat");
const { getSelectors, FacetCutAction } = require('./libraries/diamond.js')
const Table = require("cli-table3");
const { Contract, BigNumber } = require('ethers');
const DEFO_ABI = require("../abi/defo-abi.json");

const DEFO_TOKEN = "0x5C7ea2D484464a6Be1c2028CE1E9e1Ec339Dd3Ae";
const DAI_TOKEN = "0x85a2ff500E0eD9fA93719071EA46A86198181581";
const JOE_ROUTER_MAIN = "0x60aE616a2155Ee3d9A68541Ba4544862310933d4";

const formatBalance = (balance, decimals = 18) => Number(balance.div(BigNumber.from(10).pow(decimals)));

// (seconds in a day) * count days
const REWARD_TIME = (3600 * 24) * 7;

// fix these numbers
const saphireGem = {
	LastMint: "0",
	MaintenanceFee: "50000000000000000", // daily fee 
	RewardRate: "88", // 88.57
	DailyLimit: "32",
	MintCount: "0",
	DefoPrice: ethers.utils.parseEther("5"),
	StablePrice: ethers.utils.parseEther("25")
}
const rubyGem = {
	LastMint: "0",
	MaintenanceFee: "200000000000000000",
	RewardRate: "85", // 85.71
	DailyLimit: "8",
	MintCount: "0",
	DefoPrice: ethers.utils.parseEther("20"),
	StablePrice: ethers.utils.parseEther("100")
}
const diamondGem = {
	LastMint: "0",
	MaintenanceFee: "800000000000000000",
	RewardRate: "89", // 89.29
	DailyLimit: "2",
	MintCount: "0",
	DefoPrice: ethers.utils.parseEther("80"),
	StablePrice: ethers.utils.parseEther("400")
}


async function deployDiamond() {
	const table = new Table({
		head: ['Contracts', 'contract addresses'],
		colWidths: ['auto', 'auto']
	});

	const [deployer, treasury, donations, team, vault, rewardPool, ...restAccounts] = await ethers.getSigners();
	const provider = deployer.provider

	const defoInstance = await ethers.getContractAt(DEFO_ABI, DEFO_TOKEN, deployer);
	const daiInstance = await ethers.getContractAt(DEFO_ABI, DAI_TOKEN, deployer);

	// send some DEFO to treasury
	await defoInstance.transfer(treasury.address, ethers.utils.parseEther("10000"));
	await daiInstance.transfer(treasury.address, ethers.utils.parseEther("1500"));

	console.log(await getAllAddressesDefoBalances(defoInstance, deployer, treasury, donations, team, vault, rewardPool));

	table.push(
		["deployer", deployer.address],
		["team", team.address],
		["treasury", treasury.address],
		["donations", donations.address],
		["vault", vault.address]
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

	const erc721Facet = await ethers.getContractAt("ERC721Facet", diamond.address);
	const ownerFacetInstance = await ethers.getContractAt('OwnerFacet', diamond.address);
	const gemGetterFacetInstance = await ethers.getContractAt("GemGettersFacet", diamond.address);
	const gemFacetInstance = await ethers.getContractAt("GemFacet", diamond.address);
	const vaultStakingFacetInstance = await ethers.getContractAt("VaultStakingFacet", diamond.address);

	const avaxBalance = formatBalance(await provider.getBalance(deployer.address)).toString();
	const deployerDefoBalance = formatBalance(await defoInstance.balanceOf(deployer.address)).toString();
	const deployerDaiBalance = formatBalance(await daiInstance.balanceOf(deployer.address)).toString();

	table.push(
		["Deployer AVAX balance: ", avaxBalance],
		["Deployer DEFO balance: ", deployerDefoBalance],
		["Deployer DAI balance: ", deployerDaiBalance]
	);

	// TODO: update with valid addresses
	// initialize diamondStorage
	await ownerFacetInstance.initialize(
		deployer.address,
		DEFO_TOKEN,
		DAI_TOKEN,
		treasury.address,
		diamond.address,
		rewardPool.address,
		donations.address,
	)
	await erc721Facet.initialize("Defo Node", "DFN");

	await ownerFacetInstance.setAddressAndDistTeam(team.address, 0, 0);
	await ownerFacetInstance.setAddressAndDistLiquidity(deployer.address, 2500, 2500);
	await ownerFacetInstance.setAddressAndDistRewardPool(rewardPool.address, 7500);
	await ownerFacetInstance.setAddressAndDistTreasury(treasury.address, 7500);
	await ownerFacetInstance.setAddressDonation(donations.address, 500);
	await ownerFacetInstance.setAddressVault(vault.address);
	await ownerFacetInstance.setMinRewardTime(REWARD_TIME);

	await ownerFacetInstance.setRewardTax(["3000", "2000", "1000", "0"]);
	await ownerFacetInstance.setGemSettings("0", saphireGem);
	await ownerFacetInstance.setGemSettings("1", rubyGem);
	await ownerFacetInstance.setGemSettings("2", diamondGem);
	await ownerFacetInstance.setMintLimitHours("12");
	await ownerFacetInstance.setMaintenanceDays("30")

    // SOME OF THESE MUST BE RUN BT THE USER NOT HERE
	// activate limit hours

	await defoInstance.connect(rewardPool).approve(diamond.address, ethers.constants.MaxUint256);
	await defoInstance.connect(vault).approve(diamond.address, ethers.constants.MaxUint256);
	await defoInstance.connect(donations).approve(diamond.address, ethers.constants.MaxUint256);

	// gem minter need to approve dai/defo
	await defoInstance.connect(treasury).approve(diamond.address, ethers.constants.MaxUint256);
	await daiInstance.connect(treasury).approve(diamond.address, ethers.constants.MaxUint256);

	await defoInstance.approve(diamond.address, ethers.constants.MaxUint256);
	await daiInstance.approve(diamond.address, ethers.constants.MaxUint256);

	await defoInstance.approve(deployer.address, ethers.constants.MaxUint256);
	await daiInstance.approve(deployer.address, ethers.constants.MaxUint256);


	console.log(table.toString());

	return diamond.address
}

async function getDefoDaiBalance(defoInstance, daiInstance, deployer) {
	const defoBalance = formatBalance(await defoInstance.balanceOf(deployer.address));
	const daiBalance = formatBalance(await daiInstance.balanceOf(deployer.address));

	return { DEFO: defoBalance, DAI: daiBalance }
}

async function mintGem(gemFacetInstance, type) {
	return await gemFacetInstance.MintGem(type)
}

// return the closest amount of hours
function getHoursFromSecondsInRange(number) {
	const seconds = Math.round(number / 100) * 100;
	const hours = Math.floor(seconds / 3600);

	return hours
	// console.log(`seconds: ${seconds}`);
	// console.log(`hours: ${hours}`);
}

async function getAllAddressesDefoBalances(defoInstance, deployer, treasury, donations, team, vault, rewardPool) {
	return {
		deployer: ethers.utils.formatEther(await defoInstance.balanceOf(deployer.address)),
		treasury: ethers.utils.formatEther(await defoInstance.balanceOf(treasury.address)),
		donations: ethers.utils.formatEther(await defoInstance.balanceOf(donations.address)),
		team: ethers.utils.formatEther(await defoInstance.balanceOf(team.address)),
		vault: ethers.utils.formatEther(await defoInstance.balanceOf(vault.address)),
		rewardPool: ethers.utils.formatEther(await defoInstance.balanceOf(rewardPool.address)),
	}
}



if (require.main === module) {
	deployDiamond()
		.then(() => process.exit(0))
		.catch(error => {
			console.error(error)
			process.exit(1)
		})
}

