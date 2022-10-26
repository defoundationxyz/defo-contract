import { ERC721EnumerableFacet } from "@contractTypes/contracts/erc721-facet";
import { IDEFODiamond } from "@contractTypes/contracts/interfaces";
import { announce, info, networkInfo } from "@utils/output.helper";
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
    const diamondContract = await ethers.getContract<IDEFODiamond & ERC721EnumerableFacet>("DEFODiamond");

    const workbook = new Excel.Workbook();
    const worksheet = workbook.addWorksheet("DeFo Users");
    const columns = [
      { key: "address", header: "User" },
      { key: "avax", header: "Avax" },
      { key: "dai", header: "Dai" },
      { key: "defo", header: "DEFO" },
      { key: "gems", header: "Gems" },
      { key: "vault", header: "DEFO in Vault" },
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
        const userGems = (await diamondContract.getGemIdsOf(accountAddress)).map(gemId => gemId.toNumber());
        const stakedForGems = await Promise.all(userGems.map(gemId => diamondContract.getStaked(gemId)));
        const vault = stakedForGems.reduce<BigNumber>(
          (totalStaked, stakedForGem) => totalStaked.add(stakedForGem),
          ethers.constants.Zero,
        );
        const data = {
          address: accountAddress,
          avax: Number(Number(fromWei(await ethers.provider.getBalance(accountAddress))).toFixed(3)),
          dai: Number(Number(fromWei(await daiContract.balanceOf(accountAddress))).toFixed(3)),
          defo: defoContract && Number(Number(fromWei(await defoContract.balanceOf(accountAddress))).toFixed(3)),
          gems: Number(await diamondContract.balanceOf(accountAddress)),
          vault: Number(fromWei(vault)),
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
