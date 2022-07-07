import { task, types } from "hardhat/config";
import moment from "moment";

import { info } from "../utils/helpers";

export default task("jump-in-time", "Jump given time ahead")
  .addOptionalParam("time", "Time to skip in a human-readable format: '1y', '10d', '20h', etc.", "1y", types.string)
  .setAction(async ({ time }, hre) => {
    const num = time.match(/[0-9]+/g)[0];
    const unit = time.slice(num.length);
    const seconds = moment.duration(num, unit).asSeconds();
    info(`Jumping ${time} ahead which is ${seconds} seconds`);
    await hre.network.provider.send("evm_increaseTime", [seconds]);
    await hre.ethers.provider.send("evm_mine", []);
  });
