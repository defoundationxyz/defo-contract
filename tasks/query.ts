import { ERC721EnumerableFacet } from "@contractTypes/contracts/erc721-facet";
import { ConfigFacet } from "@contractTypes/contracts/facets";
import { IDEFODiamond } from "@contractTypes/contracts/interfaces";
import { announce, formatAmount, info, networkInfo } from "@utils/output.helper";
import DAI_ABI from "abi/dai-abi.json";
import assert from "assert";
import chalk from "chalk";
import { BigNumber } from "ethers";
import Excel from "exceljs";
import { task, types } from "hardhat/config";
import path from "path";

task("query", "Get all the users with their balance, gems, and vault information.")
  .addOptionalParam("silent", "true for silent output", false, types.boolean)
  .setAction(async ({ silent }, hre) => {
    const {
      getNamedAccounts,
      deployments,
      ethers,
      ethers: {
        utils: { formatEther: fromWei },
      },
    } = hre;
    const namedAccounts = await getNamedAccounts();
    const { dai, forkedDefoToken } = namedAccounts;
    const daiContract = await ethers.getContractAt(DAI_ABI, dai);
    const defoTokenDeployment = (await deployments.getOrNull("DEFOToken"))?.address || "";
    const diamondContract = await ethers.getContract<IDEFODiamond & ERC721EnumerableFacet & ConfigFacet>("DEFODiamond");

    const workbook = new Excel.Workbook();
    const worksheet = workbook.addWorksheet("DeFo Users");
    const columns = [
      { key: "address", header: "User" },
      { key: "avax", header: "Avax" },
      { key: "dai", header: "Dai" },
      { key: "defo", header: "DEFO" },
      { key: "gems", header: "Gems" },
      { key: "vault", header: "DEFO in Vault" },
      { key: "claimedGross", header: "claimedGross" },
      { key: "claimedNet", header: "claimedNet" },
      { key: "stakedGross", header: "stakedGross" },
      { key: "stakedNet", header: "stakedGross" },
      { key: "unStakedGross", header: "unStakedGross" },
      { key: "unStakedGrossUp", header: "unStakedGrossUp" },
      { key: "unStakedNet", header: "unStakedNet" },
      { key: "donated", header: "donated" },
      { key: "claimTaxPaid", header: "claimTaxPaid" },
      { key: "vaultTaxPaid", header: "vaultTaxPaid" },
    ];

    worksheet.columns = columns;

    const totalSupply = await diamondContract.totalSupply();
    if (!silent) info(`\n 📡 Total ${totalSupply} gems minted. Querying details...`);
    if (totalSupply.isZero()) throw new Error("No gems minted");

    const gemIds = await Promise.all(
      [...Array(totalSupply.toNumber()).keys()].map(async i => await diamondContract.tokenByIndex(i)),
    );

    const users = new Set<string>();
    for (const id of gemIds) {
      if (!silent) process.stdout.write(`Querying owner of token ${id}\r`);
      users.add(await diamondContract.ownerOf(id));
    }
    const usersArray = Array.from(users);

    if (!silent) info(`Total ${usersArray.length} users.`);

    const defoContract =
      forkedDefoToken || defoTokenDeployment
        ? await ethers.getContractAt("DEFOToken", forkedDefoToken || defoTokenDeployment)
        : null;
    if (!silent) await networkInfo(hre, info);
    assert(defoContract, "defoContract is null");
    if (!silent)
      announce(
        `DEFO token is ${chalk.yellow(
          forkedDefoToken ? "on live network" : defoTokenDeployment ? "deployed locally" : chalk.red("not deployed!"),
        )}. Address: ${defoContract.address}`,
      );

    const table = await Promise.all(
      usersArray.map(async accountAddress => {
        const userGems = (await diamondContract.getGemIdsOf(accountAddress)).map(gemId => gemId.toString());
        const stakedForGems = await Promise.all(userGems.map(gemId => diamondContract.getStaked(gemId)));
        const vault = stakedForGems.reduce<BigNumber>(
          (totalStaked, stakedForGem) => totalStaked.add(stakedForGem),
          ethers.constants.Zero,
        );
        const userData = await diamondContract.getTotal(accountAddress);
        const data = {
          address: accountAddress,
          avax: formatAmount(await ethers.provider.getBalance(accountAddress)),
          dai: formatAmount(await daiContract.balanceOf(accountAddress)),
          defo: defoContract && formatAmount(await defoContract.balanceOf(accountAddress)),
          gems: Number(await diamondContract.balanceOf(accountAddress)),
          vault: Number(fromWei(vault)),
          claimedGross: formatAmount(userData.claimedGross),
          claimedNet: formatAmount(userData.claimedNet),
          stakedGross: formatAmount(userData.stakedGross),
          stakedNet: formatAmount(userData.stakedNet),
          unStakedGross: formatAmount(userData.unStakedGross),
          unStakedGrossUp: formatAmount(userData.unStakedGrossUp),
          unStakedNet: formatAmount(userData.unStakedNet),
          donated: formatAmount(userData.donated),
          claimTaxPaid: formatAmount(userData.claimTaxPaid),
          vaultTaxPaid: formatAmount(userData.vaultTaxPaid),
        };
        worksheet.addRow(data);
        if (!silent) process.stdout.write(`processed ${accountAddress}\r`);
        return data;
      }),
    );
    if (!silent) console.table(table);
    const exportPath = path.resolve(__dirname, "query.xlsx");

    await workbook.xlsx.writeFile(exportPath);
  });
