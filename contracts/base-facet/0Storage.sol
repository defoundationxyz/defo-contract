// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.9;
import "@openzeppelin/contracts/utils/Context.sol";
import {AppStorage} from "../libraries/LibAppStorage.sol";

contract Storage is Context {
    AppStorage internal s;
}
