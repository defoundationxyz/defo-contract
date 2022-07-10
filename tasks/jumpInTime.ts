import { task, types } from "hardhat/config";
import moment from "moment";

import { increaseTime } from "../utils/chain.helper";
import { announce, success } from "../utils/output.helper";

export default task("jump-in-time", "Jump given time ahead")
  .addOptionalParam("time", "Time to skip in a human-readable format: '1y', '10d', '20h', etc.", "1y", types.string)
  .setAction(async ({ time }, hre) => {
    const num = time.match(/[0-9]+/g)[0];
    const unit = time.slice(num.length);
    const seconds = moment.duration(num, unit).asSeconds();
    const human = moment.duration(num, unit).humanize();
    announce(`Jumping ${time} (${human}) ahead which is ${seconds} seconds`);
    await increaseTime(hre.ethers.provider, seconds);
    success("Done.");
  });
