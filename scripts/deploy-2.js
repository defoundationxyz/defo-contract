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

const saphireGem = {
	LastMint: "0",
	MaintenanceFee: "10",
	RewardRate: "2",
	DailyLimit: "5",
	MintCount: "0",
	DefoPrice: ethers.utils.parseEther("5"),
	StablePrice: ethers.utils.parseEther("25")
}
const rubyGem = {
	LastMint: "0",
	MaintenanceFee: "50",
	RewardRate: "3",
	DailyLimit: "5",
	MintCount: "0",
	DefoPrice: ethers.utils.parseEther("20"),
	StablePrice: ethers.utils.parseEther("100")
}
const diamondGem = {
	LastMint: "0",
	MaintenanceFee: "350",
	RewardRate: "4",
	DailyLimit: "5",
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
		// mDefoToken.address,
		// mDaiToken.address,
		treasury.address,
		diamond.address,
		rewardPool.address,
		donations.address,
	)
	await erc721Facet.initialize("Defo Node", "DFN");

	await ownerFacetInstance.setAddressAndDistTeam(team.address, 50, 50);
	await ownerFacetInstance.setAddressAndDistLiquidity(deployer.address, 0, 0);
	await ownerFacetInstance.setAddressDonation(donations.address, 5);
	await ownerFacetInstance.setAddressVault(vault.address);
	await ownerFacetInstance.setMinRewardTime(REWARD_TIME);

	await ownerFacetInstance.setRewardTax(["500", "300", "100", "0"]);
	await ownerFacetInstance.setGemSettings("0", saphireGem);
	await ownerFacetInstance.setGemSettings("1", rubyGem);
	await ownerFacetInstance.setGemSettings("2", diamondGem);

	// activate limit hours
	await ownerFacetInstance.setMintLimitHours("12");

	await defoInstance.connect(treasury).approve(diamond.address, ethers.utils.parseEther("10000000000000000000000000"));
	await defoInstance.connect(rewardPool).approve(diamond.address, ethers.utils.parseEther("10000000000000000000000000"));

	await defoInstance.approve(diamond.address, ethers.utils.parseEther("10000000000000000000000000"));
	await daiInstance.approve(diamond.address, ethers.utils.parseEther("10000000000000000000000000"));

	await defoInstance.approve(deployer.address, ethers.utils.parseEther("10000000000000000000000000"));
	await daiInstance.approve(deployer.address, ethers.utils.parseEther("10000000000000000000000000"));

	// table.push(["treasury balance before mint", ethers.utils.formatEther(await defoInstance.balanceOf(treasury.address))])
	const GEM_TYPE_1 = 1;

	await mintGem(gemFacetInstance, 0); // 0.75 -> treasury
	await mintGem(gemFacetInstance, 1);
	await mintGem(gemFacetInstance, 1); // 7.5
	await mintGem(gemFacetInstance, 2); // 75 -> treasury

	console.log('BALANCES AFTER MINT');
	console.log(await getAllAddressesDefoBalances(defoInstance, deployer, treasury, donations, team, vault, rewardPool));

	// table.push(["treasury balance after mint", ethers.utils.formatEther(await defoInstance.balanceOf(treasury.address))])
	console.log(table.toString());


	const isMintAvailable = await gemGetterFacetInstance.isMintAvailableForGem(0);
	if (!isMintAvailable) {
		await network.provider.send('evm_increaseTime', [3600 * 5]);
		await ethers.provider.send('evm_mine');

		const timeLeft = await gemGetterFacetInstance.getExpiredTimeSinceLock(0);
		console.log('Expired hours since lock: ', timeLeft);
		console.log(`hours until mint: `, getHoursFromSecondsInRange(timeLeft));
	}

	const getGemIdsTx = await gemFacetInstance.getGemIdsOf(deployer.address);
	const gemIdsCollection = getGemIdsTx.map(item => +item)
	console.log('gemIds: ', gemIdsCollection);

	// test rewards / increase time
	const DAYS_AFTER = 80;
	await network.provider.send("evm_increaseTime", [86400 * DAYS_AFTER])
	await ethers.provider.send('evm_mine');

	const checkRewardTx0 = ethers.utils.formatEther(await gemFacetInstance.checkRawReward(0));
	console.log(`reward after ${DAYS_AFTER} days for gem id 0: `, checkRewardTx0);

	const checkRewardTx1 = ethers.utils.formatEther(await gemFacetInstance.checkRawReward(1));
	console.log(`reward after ${DAYS_AFTER} days for gem id 1: `, checkRewardTx1);

	const checkRewardTx2 = ethers.utils.formatEther(await gemFacetInstance.checkRawReward(2));
	console.log(`reward after ${DAYS_AFTER} days for gem id 2: `, checkRewardTx2);

	const checkRewardTx3 = ethers.utils.formatEther(await gemFacetInstance.checkRawReward(3));
	console.log(`reward after ${DAYS_AFTER} days for gem id 3: `, checkRewardTx3);

	const percentage = BigNumber.from("50");
	const number = BigNumber.from("200");
	let result = percentage.mul(BigNumber.from("100")).div(number);
	// console.log('result: ', result);

	// const totalCharityBefore = await gemGetterFacetInstance.getTotalCharity(deployer.address);
	// console.log('totalCharityBefore: ', ethers.utils.formatEther(totalCharityBefore));

	// const defoBefore =  ethers.utils.formatEther(await defoInstance.balanceOf(deployer.address))
	// console.log('defoBefore: ', defoBefore);

	// const gem0Amount = (await gemFacetInstance.checkTaxedReward(0)).div(100).mul(20);
	// const gem1Amount = (await gemFacetInstance.checkTaxedReward(1)).div(100).mul(20);
	// const gem2Amount = (await gemFacetInstance.checkTaxedReward(2)).div(100).mul(20);
	// const gem3Amount = (await gemFacetInstance.checkTaxedReward(3)).div(100).mul(100);
	// console.log('gem1Amount: ', ethers.utils.formatEther(gem1Amount));
	// console.log('gem2Amount: ', ethers.utils.formatEther(gem2Amount));
	// console.log('gem3Amount: ', ethers.utils.formatEther(gem3Amount));

	// // 20% - 15.8404
	// // 100% - 79.202

	// await gemFacetInstance.BatchMaintenance([1, 2]);
	// await vaultStakingFacetInstance.batchAddTovault([1, 2], [gem1Amount, gem2Amount]);

	// const stakedAmount = await vaultStakingFacetInstance.showStakedAmount();
	// console.log('stakedAmount: ', ethers.utils.formatEther(stakedAmount));

	// await gemFacetInstance.BatchClaimRewards([1, 2]);

	// const totalCharityAfter = await gemGetterFacetInstance.getTotalCharity(deployer.address);
	// console.log('totalCharityAfter: ', ethers.utils.formatEther(totalCharityAfter));
	
	// const defoAfter =  ethers.utils.formatEther(await defoInstance.balanceOf(deployer.address))
	// console.log('defoAfter: ', defoAfter);

	// 96833 - VAULT
	// 97916 - no VAULT

	// // add to vault
	// const taxedReward = ethers.utils.formatEther(await gemFacetInstance.checkTaxedReward(0));
	// console.log('taxedReward: ', taxedReward);

	// // const percentageAmount = BigNumber.from("20");
	// // const amountToProvideToTheVault = percentageAmount.mul(BigNumber.from("100")).div(taxedReward);
	// // console.log('amountToProvideToTheVault: ', amountToProvideToTheVault);

	// const tapperReward = await gemFacetInstance.checkTaperedReward(0);

	// console.log('tapperReward: ', tapperReward);
	// const investAmount = BigNumber.from("8000000000000000000");
	// console.log('investAmount: ', investAmount);

	// await gemFacetInstance.Maintenance(0, 0);
	// await vaultStakingFacetInstance.addToVault(0, investAmount);

	// const stakedAmount = await vaultStakingFacetInstance.showStakedAmount();
	// console.log('stakedAmount: ', stakedAmount)

	// // batch add to vault
	// for (const gemId of gemIdsCollection) {
	// 	const gemPendingReward = await gemFacetInstance.checkTaxedReward(gemId);
	// 	// const gem20Procent = gemPendingReward.mul(100);
	// 	// const percentage = gem20Procent.div
	// 	console.log(`${gemId} has pending reward: ${ethers.utils.formatEther(gemPendingReward)}`);
	// }


	// [8] LastReward
	// console.log('gem0 before claim: ', await gemGetterFacetInstance.GemOf(0));

	// // pay claim fee's and claimRewards for ONE GEM
	// await gemFacetInstance.Maintenance(0, 0);
	// const taxedReward = await gemFacetInstance.checkTaxedReward(0);
	// console.log('taxedReward: ', ethers.utils.formatEther(taxedReward));
	// await gemFacetInstance.ClaimRewards(0);

	// const totalCharity = await gemGetterFacetInstance.getTotalCharity(deployer.address);
	// console.log('totalCharity: ', ethers.utils.formatEther(totalCharity));

	// // const stakedAmount = await vaultStakingFacetInstance.showStakedAmount();
	// // console.log('stakedAmount: ', ethers.utils.formatEther(stakedAmount));

	// // check if gem eligable for claim
	// console.log('---------check if gem eligable for claim---------');
	// console.log(await getAreGemsEligableForClaim(gemGetterFacetInstance, provider, [0]));
	// console.log('AFTER 7 days');
	// await network.provider.send("evm_increaseTime", [86401 * 7]) // increase by 7 days
	// await ethers.provider.send('evm_mine');
	// console.log(await getAreGemsEligableForClaim(gemGetterFacetInstance, provider, [0]));

	// await gemFacetInstance.Maintenance(0, 0);
	// await gemFacetInstance.ClaimRewards(0);

	// console.log('charity after 7 days more: ', ethers.utils.formatEther(await gemGetterFacetInstance.getTotalCharity(deployer.address)));

	// await network.provider.send("evm_increaseTime", [86401 * 365]) // increase by 7 days
	// await ethers.provider.send('evm_mine');

	// // BATCH pay fee and claimRewards - be sure treasury has enough funds to pay
	// await gemFacetInstance.BatchMaintenance(gemIdsCollection);
	// await gemFacetInstance.BatchClaimRewards(gemIdsCollection);

	// console.log('charity after 365 days more and claimed all gems: ',
	// 	ethers.utils.formatEther(await gemGetterFacetInstance.getTotalCharity(deployer.address))
	// );

	// console.log('BALANCES AFTER BATCH');
	// console.log(await getAllAddressesDefoBalances(defoInstance, deployer, treasury, donations, team, vault, rewardPool)); 


	// console.log('DEFO After Batch -------');
	// const defoAfterBatch = await defoInstance.balanceOf(deployer.address);
	// console.log('defoAfterBatch: ', ethers.utils.formatEther(defoAfterBatch));

	// console.log('Treasury After Batch: ', ethers.utils.formatEther(await defoInstance.balanceOf(treasury.address)));

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

async function getIsEligableForClaim(gemGetterFacetInstance, provider) {
	const gem0 = await gemGetterFacetInstance.GemOf(0);
	const blockNumber = await provider.getBlockNumber();
	const timestamp = await (await provider.getBlock(blockNumber)).timestamp
	const rewardPoints = timestamp - gem0.LastReward; // in seconds - 86 400 => 1 day

	console.log('rewardPoints: ', rewardPoints);
	// console.log('gem last reward: ', gem0.LastReward);
	// console.log('timestamp: ', timestamp);
	console.log('is eligable: ', rewardPoints > REWARD_TIME);
}

async function getAreGemsEligableForClaim(gemGetterFacetInstance, provider, gemsIdCollection) {
	const blockNumber = await provider.getBlockNumber();
	const timestamp = await (await provider.getBlock(blockNumber)).timestamp;

	for (const gemId of gemsIdCollection) {
		const gem = await gemGetterFacetInstance.GemOf(gemId);
		const rewardPoints = timestamp - gem.LastReward;
		if (rewardPoints <= REWARD_TIME) { return false; }
	}
	return true;
}

if (require.main === module) {
	deployDiamond()
		.then(() => process.exit(0))
		.catch(error => {
			console.error(error)
			process.exit(1)
		})
}

