/* global ethers */
/* eslint prefer-const: "off" */

const { ethers } = require('hardhat')
const { getSelectors, FacetCutAction } = require('./libraries/diamond.js')
const Table = require("cli-table3");
const { Contract, BigNumber } = require('ethers');

const DEFO_TOKEN = "0x5C7ea2D484464a6Be1c2028CE1E9e1Ec339Dd3Ae";
const DAI_TOKEN = "0x85a2ff500E0eD9fA93719071EA46A86198181581";

const formatBalance = (balance, decimals = 18) => Number(balance.div(BigNumber.from(10).pow(decimals)));


async function deployDiamond() {
	const table = new Table({
		head: ['Contracts', 'contract addresses'],
		colWidths: ['auto', 'auto']
	});

	// const provider = ethers.getDefaultProvider();

	const [deployer, team, ...restAccounts] = await ethers.getSigners();
	const provider = deployer.provider;

	table.push(
		["deployer", deployer.address],
		["team", team.address]
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


	const ownerFacetInstance = await ethers.getContractAt('OwnerFacet', diamond.address);
	const gemGetterFacetInstance = await ethers.getContractAt("GemGettersFacet", diamond.address);
	// console.log('ownerFacetInstance: ', ownerFacetInstance);
	// console.log('gemGetterFacetInstance: ', gemGetterFacetInstance);

	// TODO: update with valid addresses
	// initialize diamondStorage
	const initializeTx = await ownerFacetInstance.initialize(
		deployer.address,
		DEFO_TOKEN,
		DAI_TOKEN,
		team.address,
		team.address,
		team.address,
		team.address
	)

	const gemMetaTx = await gemGetterFacetInstance.getMeta();
	console.log('gemMetaTx: ', gemMetaTx);
	
	const balance = formatBalance(await provider.getBalance(deployer.address));
	console.log('balance: ', balance);

	console.log(table.toString());
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

