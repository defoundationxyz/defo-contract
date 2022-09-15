// redeem script
// 0. collect all the receivers of the nodes from mainnet
// 1. sort these receivers, there would be 9 types: 3 gems, and 3 x 2 boosted ones
// 2. mint in the loop, checking if the address is a presale gem holder, once minted - deactivate gems
// Add separate task to deploy a test contract and a test node to check
import { PRESALE_NODES, presaleNodes } from "@constants/addresses";
import { YieldGemFacet } from "@contractTypes/contracts/facets";
import { DiamondNode } from "@contractTypes/contracts/presale/presaleDiamond.sol";
import { isFuji } from "@utils/chain.helper";
import { announce, info, networkInfo, success } from "@utils/output.helper";
import { Address } from "hardhat-deploy/dist/types";
import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";


export default task("redeem", "mints gems for the pre-sold nodes").setAction(
  async (_, hre: HardhatRuntimeEnvironment) => {
    const { deployments, ethers } = hre;
    await networkInfo(hre, info);
    const defoDiamond = await ethers.getContract<YieldGemFacet>("DEFODiamond");

    for (const nodeContractName of presaleNodes) {
      const nodeAddress = (await isFuji(hre))
        ? (await deployments.get(nodeContractName)).address
        : PRESALE_NODES[nodeContractName].address;
      const contract = await ethers.getContractAt<DiamondNode>("DiamondNode", nodeAddress);
      const totalSupply = (await contract.totalSupply()).toNumber();
      const activeSale = await contract.activeSale();
      announce(
        `\n\nRedeeming ${nodeContractName}, ${nodeAddress}, supply: ${totalSupply} node(s), active sale: ${activeSale}`,
      );

      //collecting presold node balances
      const nodeBalances = new Array<{ address: Address; balance: number }>();
      // const nodeBalances: Array<{ address: Address; balance: number }> = [];
      for (let nodeIndex = 0; nodeIndex < totalSupply; nodeIndex++) {
        let nodeHolder: string = "";
        try {
          const nodeId = await contract.tokenByIndex(nodeIndex);
          nodeHolder = await contract.ownerOf(nodeId);
          const balance = (await contract.balanceOf(nodeHolder)).toNumber();
          const element = { address: nodeHolder, balance };
          if (!nodeBalances.find(el => el.address === nodeHolder)) {
            info(
              `${nodeIndex.toString().padStart(3)} of ${totalSupply.toString().padStart(3)}: ${nodeHolder} has ${balance
                .toString()
                .padStart(2)} ${nodeContractName}s`,
            );
            nodeBalances.push(element);
          }
        } catch (e) {
          info(`node index ${nodeIndex} doesn't exist`);
        }
      }
      info("Pre-sold collected. Now minting yield gems...");
      //checking how many exist already to avoid double minting and minting the rest
      for (const nodeBalance of nodeBalances) {
        const nodeHolder = nodeBalance.address;
        const gemIds = await defoDiamond.getGemIdsOf(nodeHolder);
        let alreadyMintedBalance: number = 0;
        for (const gemId of gemIds) {
          const gem = await defoDiamond.getGemInfo(gemId);
          if (
            gem.presold &&
            gem.gemTypeId === PRESALE_NODES[nodeContractName].type &&
            gem.booster === PRESALE_NODES[nodeContractName].boost
          ) {
            alreadyMintedBalance++;
          }
        }
        info(
          `\n${nodeHolder} with ${nodeBalance.balance} ${nodeContractName} pre-sold node(s) already has ${alreadyMintedBalance} presold DEFO yield gem(s).`,
        );
        const toMint = nodeBalance.balance - alreadyMintedBalance;
        if (toMint > 0) info(`Minting ${toMint}...`);
        else info(`Nothing to mint, skipping.`);
        for (let i = 1; i <= toMint; i++) {
          await (
            await defoDiamond.mintTo(
              PRESALE_NODES[nodeContractName].type,
              nodeHolder,
              PRESALE_NODES[nodeContractName].boost,
            )
          ).wait();
          success(`Minted gem ${i}`);
        }
      }
    }
  },
);
