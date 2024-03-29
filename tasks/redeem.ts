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


export default task("redeem", "mints gems for the pre-sold nodes")
  .addOptionalParam("test", "set true for testing balances, no minting, no state change", undefined, types.boolean)
  .addOptionalParam("node", "node name to redeem", undefined, types.string)
  .addOptionalParam("user", "user", undefined, types.string)
  .setAction(async ({ test, _, user }, hre: HardhatRuntimeEnvironment) => {
    const { deployments, ethers } = hre;
    await networkInfo(hre, info);
    const defoDiamond = await ethers.getContract<IDEFODiamond>("DEFODiamond");
    const { deployer } = await hre.getNamedAccounts();

    const baseNonce = ethers.provider.getTransactionCount(deployer);
    let nonceOffset = 0;
    const getNonce = () => baseNonce.then(nonce => nonce + nonceOffset++);

    // const nodes = node && presaleNodes.includes(node) ? [node as keyof typeof PRESALE_NODES] : presaleNodes;
    const nodes = [
      "SapphireNodeOmega",
      "RubyNodeOmega",
      "DiamondNodeOmega",
      "SapphireNodeDelta",
      "RubyNodeDelta",
      "DiamondNodeDelta",
    ] as const;

    for (const nodeContractName of nodes) {
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
      info("Pre-sold collected. Now minting yield gems...");
      //checking how many exist already to avoid double minting and minting the rest
      for (const nodeBalance of nodeBalances) {
        const nodeHolder = nodeBalance.address;
        if (user && user != nodeHolder) continue;
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

        const boosters = await defoDiamond.getBooster(
          nodeHolder,
          PRESALE_NODES[nodeContractName].type,
          PRESALE_NODES[nodeContractName].boost,
        );
        // const toMint = nodeBalance.balance - alreadyMintedBalance;

        let releasedBoosters = 0;
        for (const gemId of gemIds) {
          const gem = await defoDiamond.getGemInfo(gemId);
          if (
            gem.gemTypeId === PRESALE_NODES[nodeContractName].type &&
            gem.booster === PRESALE_NODES[nodeContractName].boost
          ) {
            releasedBoosters++;
          }
        }

        let toBoost =
          (PRESALE_NODES[nodeContractName].boost + 1) * nodeBalance.balance - boosters.toNumber() - releasedBoosters;

        info(
          // `\n${nodeHolder} with ${nodeBalance.balance} ${nodeContractName} pre-sold node(s) already has ${alreadyMintedBalance} presold DEFO yield gem(s) and ${boosters} booster(s). To mint ${toMint}, create boosters ${toBoost})`,
          `\n${nodeHolder} with ${nodeBalance.balance} ${nodeContractName} pre-sold node(s) already has ${alreadyMintedBalance} presold DEFO yield gem(s) and ${boosters} booster(s). Create boosters ${toBoost})`,
        );

        // if (toMint <= 0 || test) {
        //   info(`Nothing to mint or test mode, skipping`);
        // } else {
        //   await (
        //     await defoDiamond.mintToFew(
        //       PRESALE_NODES[nodeContractName].type,
        //       nodeHolder,
        //       PRESALE_NODES[nodeContractName].boost,
        //       toMint,
        //       { nonce: getNonce() },
        //     )
        //   ).wait();
        //   success(`Minted ${toMint} gems`);
        // }
        if (toBoost <= 0) {
          info(`Nothing to boost, skipping`);
        } else {
          while (toBoost > 0) {
            if (!test)
              await (
                await defoDiamond.createBooster(
                  nodeHolder,
                  PRESALE_NODES[nodeContractName].type,
                  PRESALE_NODES[nodeContractName].boost,
                  { nonce: getNonce() },
                )
              ).wait();
            else `mock for create booster`;
            toBoost--;
          }
        }
        if (toBoost > 0) {
          info(`No boosters to erase or test mode, skipping`);
        } else {
          while (toBoost < 0) {
            if (
              (
                await defoDiamond.getBooster(
                  nodeHolder,
                  PRESALE_NODES[nodeContractName].type,
                  PRESALE_NODES[nodeContractName].boost,
                )
              ).toNumber() > 0
            ) {
              if (!test)
                await (
                  await defoDiamond.removeBooster(
                    nodeHolder,
                    PRESALE_NODES[nodeContractName].type,
                    PRESALE_NODES[nodeContractName].boost,
                    { nonce: getNonce() },
                  )
                ).wait();
              else `mock for deletefree booster`;
              success(`Deleted free booster ${PRESALE_NODES[nodeContractName].boost}`);
            } else {
              for (const gemId of gemIds) {
                const gem = await defoDiamond.getGemInfo(gemId);
                if (
                  !gem.presold &&
                  gem.gemTypeId === PRESALE_NODES[nodeContractName].type &&
                  gem.booster === PRESALE_NODES[nodeContractName].boost
                ) {
                  if (!test)
                    await (
                      await defoDiamond.setBooster(gemId, 0, {
                        nonce: getNonce(),
                      })
                    ).wait();
                  else `mock for remove booster from gem ${gemId}`;
                  success(`Removed booster from ${gemId}, booster was ${gem.booster}`);
                  break;
                }
              }
            }
            toBoost++;
          }
        }
      }
    }
  });
