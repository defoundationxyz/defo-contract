import { DEFOToken } from "@contractTypes/contracts/token";
import { getContractWithSigner } from "@utils/chain.helper";
import { expect } from "chai";
import { BigNumber } from "ethers/lib/ethers";
import hardhat, { deployments } from "hardhat";


describe("DEFOToken", () => {
  let contract: DEFOToken;
  beforeEach(async () => {
    await deployments.fixture(["DEFOToken", "DEFODiamond"]);
    contract = await getContractWithSigner<DEFOToken>(hardhat, "DEFOToken");
  });

  describe("setTransferLimit()", () => {
    it("should set transfer limit and window", async () => {
      await contract.setTransferLimit(10, 3600);
      expect(await contract.transferLimitPeriod()).eq(BigNumber.from(10));
      expect(await contract.transferLimit()).eq(BigNumber.from(3600));
    });
  });
});
