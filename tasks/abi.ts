import { AbiCoder } from "@ethersproject/abi";
import fs from "fs";
import { task } from "hardhat/config";

const basePath = "artifacts/contracts/facets/";

task("abi", "Generates ABI file for diamond, includes all ABIs of facets").setAction(async () => {
  const files = fs.readdirSync(basePath);
  const abi: AbiCoder[] = [];
  for (const file of files) {
    const jsonFile = file.replace(".sol", ".json");
    const json = fs.readFileSync(`${basePath}${file}/${jsonFile}`);
    const parsed = JSON.parse(json.toString());
    abi.push(...parsed.abi);
  }

  const finalAbi = JSON.stringify(abi);
  fs.writeFileSync("./abi/diamond.json", finalAbi);
  console.log("ABI written to abi/diamond.json");
});
