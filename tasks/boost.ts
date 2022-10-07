// redeem script
// 0. collect all the receivers of the nodes from mainnet
// 1. sort these receivers, there would be 9 types: 3 gems, and 3 x 2 boosted ones
// 2. mint in the loop, checking if the address is a presale gem holder, once minted - deactivate gems
// Add separate task to deploy a test contract and a test node to check
import { PRESALE_NODES } from "@constants/addresses";
import { IDEFODiamond } from "@contractTypes/contracts/interfaces";
import { DiamondNode } from "@contractTypes/contracts/presale/presaleDiamond.sol";
import { isFuji } from "@utils/chain.helper";
import { announce, info, networkInfo, success } from "@utils/output.helper";
import { Address } from "hardhat-deploy/dist/types";
import { task, types } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";


export default task("boost", "mints gems for the pre-sold nodes")
  .addOptionalParam("test", "set true for testing balances, no minting, no state change", undefined, types.boolean)
  .addOptionalParam("user", "user", undefined, types.string)
  .setAction(async ({ test, user }, hre: HardhatRuntimeEnvironment) => {
    const { deployments, ethers } = hre;
    await networkInfo(hre, info);
    const defoDiamond = await ethers.getContract<IDEFODiamond>("DEFODiamond");
    const { deployer } = await hre.getNamedAccounts();

    const baseNonce = ethers.provider.getTransactionCount(deployer);
    let nonceOffset = 0;
    const getNonce = () => baseNonce.then(nonce => nonce + nonceOffset++);

    const nodes = [
      "SapphireNodeOmega",
      "RubyNodeOmega",
      "DiamondNodeOmega",
      "SapphireNodeDelta",
      "RubyNodeDelta",
      "DiamondNodeDelta",
    ] as const;

    info("Collecting all 2nd presale boosters...");
    for (const nodeContractName of nodes) {
      const nodeAddress = (await isFuji(hre))
        ? (await deployments.get(nodeContractName)).address
        : PRESALE_NODES[nodeContractName].address;
      const contract = await ethers.getContractAt<DiamondNode>("DiamondNode", nodeAddress);
      const totalSupply = (await contract.totalSupply()).toNumber();
      const activeSale = await contract.activeSale();
      announce(
        `\n\nGetting owners of ${nodeContractName}, ${nodeAddress}, supply: ${totalSupply} node(s), active sale: ${activeSale}`,
      );

      //collecting presold node balances
      const nodeBalances = new Array<{ address: Address; balance: number }>();
      // const nodeBalances: Array<{ address: Address; balance: number }> = [];
      for (let nodeIndex = 0; nodeIndex < totalSupply; nodeIndex++) {
        let nodeHolder: string = "";
        try {
          const nodeId = await contract.tokenByIndex(nodeIndex);
          nodeHolder = await contract.ownerOf(nodeId);
          if (user && user != nodeHolder) continue;
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
      info("Pre-sold collected. Now boosting all 1st presold and bought if there are boosters...");
      //checking how many exist already to avoid double minting and minting the rest
      for (const nodeBalance of nodeBalances) {
        const nodeHolder = nodeBalance.address;
        if (user && user != nodeHolder) continue;
        const gemIds = await defoDiamond.getGemIdsOf(nodeHolder);
        for (const gemId of gemIds) {
          for (const booster of [1, 2]) {
            const availableBoosters = await defoDiamond.getBooster(
              nodeHolder,
              PRESALE_NODES[nodeContractName].type,
              booster,
            );
            const gem = await defoDiamond.getGemInfo(gemId);
            if (
              availableBoosters.toNumber() > 0 &&
              // gem.presold &&
              gem.booster === 0 &&
              gem.gemTypeId === PRESALE_NODES[nodeContractName].type
            ) {
              if (test) {
                info(
                  `Test mode, skipping boost ${gemId} with booster ${booster} (available boosters ${availableBoosters}`,
                );
              } else {
                await (await defoDiamond.setBooster(gemId, booster, { nonce: getNonce() })).wait();
                await (
                  await defoDiamond.removeBooster(nodeHolder, PRESALE_NODES[nodeContractName].type, booster, {
                    nonce: getNonce(),
                  })
                ).wait();
                success(
                  `Presold  ${gemId} (presold: ${gem.presold}) with booster ${booster} (available boosters was ${availableBoosters})`,
                );
              }
            }
          }
        }
      }
    }
  });
