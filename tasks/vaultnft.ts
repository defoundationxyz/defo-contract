import { announce, info, networkInfo, success } from "@utils/output.helper";
import assert from "assert";
import { task, types } from "hardhat/config";

import { DefoVaultNFT } from "../types";

const distribution: [string, number, number, number, number][] = [
  ["0x01a34f7bD5D3FeA00c1E44bDF05bA3B0A3164cd7", 1.0, 1.0, 0.0, 0.0],
  ["0x01ea4700C82bF7305c56E5B04ce76BF21A6f5b63", 1.0, 1.0, 0.0, 0.0],
  ["0x024aB03ee4b1e7a4C645661c4d7f53B94D6Cb10d", 2.0, 1.0, 0.0, 0.0],
  ["0x039187f9aC839990ECe11f35a76545516af1f689", 0.0, 2.0, 1.0, 0.0],
  ["0x03c87DEA1ce20fC1A786847F253A86AD4DeE93C2", 2.0, 1.0, 0.0, 0.0],
  ["0x044Ffe4018944C0e309Ca0bd3e386F4d0190D379", 0.0, 0.0, 0.0, 0.0],
  ["0x055b4AD6F3803405bdB4B7B0FE72286C0a8C10b0", 0.0, 0.0, 0.0, 0.0],
  ["0x074585256C14805e7D1dAd9D3d8E173F7e838456", 1.0, 0.0, 0.0, 0.0],
  ["0x074722F48E15D58fF2FC2D076e4B51F6FEB1b0B4", 1.0, 0.0, 0.0, 0.0],
  ["0x07737abA415bD610700663B633c4bAbB827F38AA", 2.0, 0.0, 1.0, 0.0],
  ["0x0FAf9345084fecb7C7774200dF186BCcE57397d6", 0.0, 0.0, 0.0, 0.0],
  ["0x0aa7324303d05E3681011001420041DEb80dd727", 0.0, 1.0, 1.0, 0.0],
  ["0x0c8ABBf476a5f2112056cBF1e67d20a4B7c93fB2", 1.0, 0.0, 0.0, 0.0],
  ["0x117893710391e14F8aF01D28596B04B68D13d207", 1.0, 1.0, 1.0, 0.0],
  ["0x119E6E00D4E459Be1d8229EEdE4689Faa1409866", 2.0, 1.0, 0.0, 0.0],
  ["0x122d4c88CdAbdc3F51020Ff3E672b2c76aF258BE", 1.0, 0.0, 0.0, 0.0],
  ["0x12372b0ee93caFe88D00ec53da94CA73B5FD767e", 0.0, 1.0, 0.0, 0.0],
  ["0x12cda495416b7Ac0d7A089b03F9654470E48C654", 1.0, 2.0, 1.0, 0.0],
  ["0x1364eA9A5c2Ca29ef1b9E8A24468C6e671cae05a", 1.0, 0.0, 0.0, 0.0],
  ["0x146AE202DC85ad1e5bEB48AC304A0A57d27afCE3", 1.0, 0.0, 0.0, 0.0],
  ["0x149Bc7dbEfd469a172dC8ec731587e291Fa70ca3", 0.0, 0.0, 0.0, 0.0],
  ["0x14C2f9F09FC5E92f66d50b72042f0e0251272Df3", 0.0, 0.0, 1.0, 0.0],
  ["0x1602c055D009248148c62d0c7b7de1151857922f", 1.0, 1.0, 0.0, 0.0],
  ["0x1604BCeE44d0f3e738adA1C019Ff208cA881266C", 1.0, 0.0, 0.0, 0.0],
  ["0x170E52D9943F4D79FE052F6714a204f261387F2F", 1.0, 0.0, 1.0, 0.0],
  ["0x1880201CC52259962236Da619c4c303cE43ac491", 1.0, 0.0, 0.0, 0.0],
  ["0x19A732b01bb695da1B1EfC11fd83A63405F609F5", 2.0, 1.0, 1.0, 10.0],
  ["0x19Bc5de9F3F1E438BDFEeA5d8cC808f1144Aa194", 1.0, 0.0, 0.0, 0.0],
  ["0x1Cf2ba455eB7FcCFE9A23Cea8A1Fd52c7B922A2e", 0.0, 0.0, 0.0, 0.0],
  ["0x1Fd05325d3236D4e07963195538b75636ABDE75C", 0.0, 0.0, 1.0, 0.0],
  ["0x1b9e47e499b779d2BCb6d627f9F8e2947DB4D3ec", 2.0, 0.0, 0.0, 1.0],
  ["0x1eB1b33F66945144299497fA31d4E0d2A08c0fB2", 2.0, 0.0, 0.0, 0.0],
  ["0x20b7A4bF443E1EE99b743571402F10755d760608", 1.0, 2.0, 0.0, 2.0],
  ["0x21F26a2d7d8516De4BF356E0854Db66ab5bEae0b", 0.0, 0.0, 0.0, 0.0],
  ["0x224bC9fe2924C82aceeA6B3881C91Ee262ba4aAA", 2.0, 2.0, 0.0, 0.0],
  ["0x2461Ed08aE562E3fb84C35Fc06d633171894DaF4", 1.0, 0.0, 0.0, 0.0],
  ["0x25c7160789D8D16212Bbd092B65133624ca826d9", 2.0, 0.0, 0.0, 0.0],
  ["0x264827B8DD1cA3EF6afB080241B3D3D8dE8178B3", 1.0, 0.0, 0.0, 1.0],
  ["0x272FE43FD00B53eBDFA54266D478b8e1Ca74F3bA", 1.0, 0.0, 1.0, 1.0],
  ["0x28cE465edc4C15d85f41Bc91CF326bdfC5B5939c", 0.0, 1.0, 0.0, 0.0],
  ["0x2A9E25FAaB76c6b3cB5134973321f8Fe9350BEF9", 2.0, 2.0, 0.0, 1.0],
  ["0x2B021a50Fa058c1b0E28c7cEd95430A7eb2Ce686", 1.0, 0.0, 2.0, 0.0],
  ["0x2DFe5eC27fE26e5d1BEfa2C9cE0A0BE7868af2f1", 0.0, 2.0, 1.0, 0.0],
  ["0x2fC5F1b2664ae66a4d3Ee0c1D619979032f44368", 2.0, 2.0, 1.0, 0.0],
  ["0x32a85F55446e7d9b8905ecf5a93ba870F05c9375", 0.0, 0.0, 1.0, 0.0],
  ["0x331D184104E07E0AdD0Fde1c4Dc6C07F6D191c94", 0.0, 2.0, 2.0, 0.0],
  ["0x367Eac14fb665822F6CAaffaC33C95D381242871", 0.0, 0.0, 1.0, 0.0],
  ["0x427b4B44D94195496A38dbdFB53EE975d82F564f", 1.0, 2.0, 2.0, 1.0],
  ["0x44D0a8923837Ac3c82d8CFD8898526629c4d597c", 2.0, 1.0, 1.0, 0.0],
  ["0x44d91186003E0fa1e3229f50259f0f966dc4bEa6", 1.0, 1.0, 0.0, 0.0],
  ["0x465bA1a17D280888EcD7200bd48547d791C39977", 1.0, 0.0, 0.0, 0.0],
  ["0x46d0bCF7f8eF33D12948DEb4f8583191a0103e60", 0.0, 0.0, 0.0, 0.0],
  ["0x4778300FB7068FAC4743Ad6a10880531a8308Ff3", 0.0, 2.0, 0.0, 0.0],
  ["0x482d3329eb3Ab650c151e41B9ECB1D9F222909Ea", 2.0, 0.0, 0.0, 0.0],
  ["0x4dDff71f9aAD86E481C4B99D5C226d57d9B8A252", 2.0, 1.0, 0.0, 1.0],
  ["0x51583CE391136638006aED35d1e52f8FD65AcaC5", 0.0, 0.0, 0.0, 0.0],
  ["0x5E370870fE87C3201aF8470291650e266892e207", 1.0, 0.0, 1.0, 0.0],
  ["0x5bAF5cD32449E0AD312eE7A695D77311eB405A92", 2.0, 0.0, 2.0, 0.0],
  ["0x60BaABc7B2c61A84f64c7493dC5d38a66fAA3Be8", 1.0, 1.0, 0.0, 2.0],
  ["0x614971bfe55692C315344008B0B7e0D35D586F19", 0.0, 2.0, 2.0, 0.0],
  ["0x62a448D4287fDb695491f1Df8F63Bb87e027A31d", 0.0, 0.0, 0.0, 0.0],
  ["0x65e842649F870b0Aa5104C076c75a45cb2f2982B", 1.0, 0.0, 0.0, 0.0],
  ["0x697F4Ea70b147a90a0B259C89786a278FC7622f1", 2.0, 0.0, 0.0, 0.0],
  ["0x6B15F6bAF4C8e9e110c0880798Ad2814c880Ac91", 0.0, 2.0, 0.0, 0.0],
  ["0x6EE26aFDde94B7985DF756d7F2D70418BC9F0720", 1.0, 2.0, 2.0, 0.0],
  ["0x6Fd140cEe6014d4e090c46cfa2Fc8EB534E310bE", 0.0, 1.0, 0.0, 0.0],
  ["0x6eB0705F2A3c32a704215055eC4F3a29DAaC1Cc6", 1.0, 0.0, 0.0, 1.0],
  ["0x767a851D1a4d954b8Fa1D9721D55C0233bF6f44F", 0.0, 0.0, 0.0, 0.0],
  ["0x76A886695b5e592883588dC51aB7ff8181Ba94C3", 0.0, 0.0, 2.0, 0.0],
  ["0x784494db52D0a07e90B789C907033B5b0236ab56", 0.0, 1.0, 0.0, 0.0],
  ["0x7DB0bfB0dF2703e24f524efa31b26893BC2995eE", 0.0, 0.0, 0.0, 0.0],
  ["0x7b495e53AA1A6b3059F3FB7b976ed1b55f3F8D3E", 1.0, 0.0, 1.0, 0.0],
  ["0x8245E11F9f7c0a828fA43AbA6A2DD875f996326C", 2.0, 2.0, 0.0, 0.0],
  ["0x82cF7d97Ec6e3bc23EC45FA0e41BC2910779aB28", 1.0, 2.0, 1.0, 0.0],
  ["0x8449c4d2250DF404217f711b7e8b7c2C10525fDb", 2.0, 0.0, 0.0, 0.0],
  ["0x84a48b2D6bd5dfaB2870b5c9d173F8870Ce41057", 1.0, 0.0, 1.0, 0.0],
  ["0x8566a6a3F75969270B98831B1486AB5D9D9fc389", 0.0, 1.0, 0.0, 0.0],
  ["0x877A5dbff61E370C7Fc8A8cEf26e7B61327A565F", 2.0, 0.0, 0.0, 0.0],
  ["0x87cDB4dA24aA2349874dC39543ca11a01bD4586C", 0.0, 1.0, 0.0, 0.0],
  ["0x890743ED23119ca10B841a4C52E804fadCf481C8", 2.0, 0.0, 0.0, 0.0],
  ["0x898b2646467aEaee0E05Ff4a47d36e86FBDb2105", 1.0, 0.0, 0.0, 0.0],
  ["0x8dF08f012221dCf2b3B0E4A17c23437028803226", 1.0, 2.0, 0.0, 0.0],
  ["0x908d3DF971E8385f96D39Ef42BAB626c26A3227E", 2.0, 0.0, 0.0, 0.0],
  ["0x91b587e5Bb9d378D2B6F18c7EA0a76635CacBb7C", 0.0, 2.0, 0.0, 0.0],
  ["0x9298fD53918b39acd3FbbBFC10bB067e2D408210", 0.0, 2.0, 2.0, 0.0],
  ["0x92C382B623Eea08FBB1D82776792A8507f8a63a0", 1.0, 0.0, 2.0, 0.0],
  ["0x92C427BB4b66DB5F0EdE27316a95fCF004A58B35", 0.0, 1.0, 0.0, 0.0],
  ["0x9467135a90023C731803289676302FA18E75F5fe", 0.0, 1.0, 1.0, 0.0],
  ["0x98A9A6220807D7C3dB504B9e019bf1d79ceeD76F", 0.0, 2.0, 0.0, 0.0],
  ["0x99Bf19dcA2125B789Cfe8A9609C1A217b4E5c918", 0.0, 0.0, 1.0, 1.0],
  ["0x99D2D2c28b7fA155ee82521ae68C6d2A9756A004", 1.0, 2.0, 0.0, 2.0],
  ["0x9B29082e51e24DC8B91497cba7E5ac597B9Aa7F6", 0.0, 0.0, 1.0, 0.0],
  ["0x9E861537ace05d35B0DA763522b013Affa4c1179", 1.0, 0.0, 0.0, 0.0],
  ["0x9c4b88fBE06b6B1E461d9D294ecB7FB0c841dB4f", 2.0, 1.0, 0.0, 0.0],
  ["0x9d00774E6f6a224008862Ab3D756c6aE5c742E05", 1.0, 0.0, 0.0, 0.0],
  ["0x9f4c5FA99bf37dCaB998549DF86733c3af166AE0", 1.0, 0.0, 0.0, 0.0],
  ["0xA0BB4b08bD4Ee5761C12A4ABf5613E71e2eba608", 2.0, 0.0, 0.0, 1.0],
  ["0xA439b49fbe3bA18A0E3Ef15158296c6044A6AEE9", 2.0, 0.0, 1.0, 0.0],
  ["0xA4c956D1EA6c3d49cDCBBc36f5817A2809040e4a", 2.0, 0.0, 0.0, 0.0],
  ["0xA63729cc775007883Ce853460b0dB54daa1F1Ee1", 2.0, 0.0, 2.0, 0.0],
  ["0xAA1E92dDd28C835fe66689771d35f38947950FD4", 0.0, 1.0, 0.0, 0.0],
  ["0xAB047519B91ab7A1e4D43Cd3784A6BD3C82c6367", 0.0, 1.0, 0.0, 0.0],
  ["0xAb05DCf5009894b55757ed33b5C371da2a1Ca734", 1.0, 0.0, 0.0, 0.0],
  ["0xB245c85c8A08f5aD86A64199494FF2A94f110cfF", 0.0, 0.0, 0.0, 0.0],
  ["0xB2B635318c54b7ac8E213eB2C6720f840F3513BC", 1.0, 0.0, 0.0, 0.0],
  ["0xB48Ae142906d066bb18F6298FDbB862592F3b5Fc", 1.0, 2.0, 1.0, 0.0],
  ["0xBEf1C679492719E21E1948FB7Da1f925cE460e4d", 1.0, 0.0, 0.0, 0.0],
  ["0xBF727997c231d149eA3CE39E826Dc399077FDAf5", 1.0, 1.0, 0.0, 0.0],
  ["0xBc811E5906d765961524F33D92278Db84cC822a4", 1.0, 1.0, 1.0, 0.0],
  ["0xC1256A713441DEF811c62A8483a4eE9dEd9E32b9", 1.0, 1.0, 0.0, 0.0],
  ["0xC4FF68d7c593093c7a749e911a73e2540cf27a60", 0.0, 1.0, 1.0, 0.0],
  ["0xC658127D9E149eb96B2c75B20E9aCD43a9Db9ee8", 2.0, 2.0, 1.0, 0.0],
  ["0xC8C220e8D61818C31C288eAcb83AD297696172F5", 2.0, 1.0, 1.0, 0.0],
  ["0xC90473c669c2147C552BC9Ede76368EC8F37c060", 0.0, 0.0, 0.0, 0.0],
  ["0xCE410800A6797f838C3590FDD4eB02aB88f3e858", 0.0, 1.0, 0.0, 0.0],
  ["0xD23A8e2d756821E5cD4D84b40285945689de03e5", 2.0, 1.0, 1.0, 0.0],
  ["0xD4C196F1236fCf59896dfb106bD611daA383967d", 1.0, 0.0, 0.0, 0.0],
  ["0xDACd25202C931AD6edB15CE12E8ecEFC5EC4A735", 2.0, 0.0, 1.0, 0.0],
  ["0xDEf051AA97eEAac3909e8Ad08aE619eE50C0645b", 2.0, 0.0, 0.0, 0.0],
  ["0xDaF81c3603C83f952376F5829a360A5822f5B5Da", 0.0, 1.0, 0.0, 0.0],
  ["0xDe639C2f28378AB59702354608d51B11a5019c3f", 0.0, 0.0, 0.0, 0.0],
  ["0xE10cE9C7ABFb11A6C656EfFA5ad224F214684D1E", 0.0, 2.0, 0.0, 0.0],
  ["0xa049AFeF83d112F9B9Ac4E9d743C50aD08EBEe01", 1.0, 0.0, 0.0, 0.0],
  ["0xa0fdaec4AB7FFdA18b55488945ea46B655FaA885", 2.0, 0.0, 0.0, 0.0],
  ["0xa52f82f04416645d632589c18EE195F3d51dBFD1", 0.0, 0.0, 0.0, 0.0],
  ["0xaACAFcB1A09E7dee5AfE3537E0d44915167B86eF", 0.0, 1.0, 0.0, 0.0],
  ["0xb8d5BCA1F21B1C01C28831cd30a1C2F38D98Be5E", 1.0, 0.0, 0.0, 0.0],
  ["0xbA109916A5f1381845d6FC4a2758C1abD196ff93", 0.0, 2.0, 0.0, 0.0],
  ["0xbBa745b1974d27e253b21295c4b2804915426Cc3", 2.0, 0.0, 0.0, 3.0],
  ["0xba32Ed278351C528EC22e9210bb5030F2786e445", 2.0, 2.0, 0.0, 0.0],
  ["0xc3A7b273f859f106deF67773BB958bE6A5907565", 1.0, 2.0, 1.0, 0.0],
  ["0xc8CAc7985E716Aa5E87621E567e3e49c08B489A1", 0.0, 1.0, 0.0, 0.0],
  ["0xd142aB6D8E7B3C7b2EfbDa250158cFA2b8680d63", 1.0, 0.0, 0.0, 0.0],
  ["0xd276895B5B5056140f87EE83945A97A2a294a39D", 0.0, 2.0, 0.0, 0.0],
  ["0xd43C861E1747f9B262cBB91bB089205b3af80458", 0.0, 1.0, 0.0, 0.0],
  ["0xd4E0335eBFD52f7bC5051e0017783972116F60D7", 1.0, 0.0, 0.0, 0.0],
  ["0xd5F66FA9a84Fe9b68Cd123bd3EFC77C0E174c0Af", 1.0, 1.0, 0.0, 0.0],
  ["0xd64691F5027f8CB8031A2C032B6A2311F2FE7Eeb", 0.0, 0.0, 0.0, 0.0],
  ["0xd8CC587DcCE9dd2a61d8911FCc3738205e543ab9", 1.0, 2.0, 0.0, 1.0],
  ["0xd94be820f17D6aEe9DCdA0D5B8aEB7d251101962", 1.0, 2.0, 0.0, 0.0],
  ["0xdF817B07ba3e582dcCDb69114632559Cf1854fF9", 2.0, 1.0, 0.0, 0.0],
  ["0xdf9f62333Fa53Fdd8B4F15e2E73af490C9cCd454", 2.0, 2.0, 1.0, 0.0],
  ["0xe13A8a33b7919bd0b7Eed1293a7C3D02716B1b6C", 1.0, 0.0, 0.0, 0.0],
  ["0xe1A51d8A7131ba86CCB92fe27BC299982dD01760", 2.0, 1.0, 0.0, 0.0],
  ["0xe5f0dA122c1b40372Ffa80245f731dB57366756A", 2.0, 1.0, 0.0, 0.0],
  ["0xf24456E8eBDEcE78680377f064fF2c2F90e0AEDe", 2.0, 1.0, 0.0, 0.0],
  ["0xf2C95079E35a27c296B01759431e05c38E392A21", 2.0, 1.0, 1.0, 1.0],
  ["0xf8b8C685bb3bCaA381d15A8C2a7D84F052c84301", 1.0, 0.0, 0.0, 0.0],
  ["0xf8c986B1E5e8aB153EA18eB7F9bb81f9a5f2849a", 1.0, 1.0, 1.0, 0.0],
  ["0xf99D8717c3c2BB5A4959faB7F152eddeE56580e2", 1.0, 2.0, 1.0, 3.0],
  ["0xfDBD731e3533849f58BF38956e0D3937674f239a", 1.0, 0.0, 0.0, 0.0],
  ["0xfcF0E1CcD5973b352a7512C634cb60cfBA53416c", 0.0, 1.0, 0.0, 3.0],
  ["0xff5783399453Cd77D66A45730BAaBfdeD5615929", 1.0, 0.0, 0.0, 0.0],
];

const tokenIdsOffset: Record<number, number> = {
  1: 0,
  2: 200,
  3: 350,
  4: 425,
};

const sent: Record<number, number> = {
  1: 0,
  2: 0,
  3: 0,
  4: 0,
};

const balances: { [address: string]: [number, number, number, number] } = {};

task("vaultnft", "send vaultnfts to everyone")
  .addParam("test", "test switch", true, types.boolean)
  .addParam("balance", "get deployer balance only", false, types.boolean)
  .setAction(async ({ test, balance }, hre) => {
    const { ethers } = hre;
    await networkInfo(hre, info);
    const { deployer } = await hre.getNamedAccounts();
    const p2Vault = await ethers.getContract<DefoVaultNFT>("DefoVaultNFT");
    if (balance) {
      const balance = await p2Vault.balanceOf(deployer);
      for (let i = 0; i < balance.toNumber(); i++) {
        const tokenId = await p2Vault.tokenOfOwnerByIndex(deployer, i);
        const tier = (await p2Vault.tokenTiers(tokenId)).toNumber();
        info(`tokenID: ${tokenId} tier: ${["sapphire", "ruby", "diamond", "emerald"][tier - 1]}`);
      }
      process.exit(0);
    }

    info("getting current user balances...");
    for (const user of distribution) {
      balances[user[0]] = [0, 0, 0, 0];
      const balance = await p2Vault.balanceOf(user[0]);
      for (let i = 0; i < balance.toNumber(); i++) {
        const tokenId = await p2Vault.tokenOfOwnerByIndex(user[0], i);
        const tier = await p2Vault.tokenTiers(tokenId);
        balances[user[0]][tier.toNumber() - 1]++;
      }
      info(`> ${user[0]}: ${JSON.stringify(balances[user[0]])}`);
    }

    announce("\nsending vault nfts...");

    let check = true;
    for (const user of distribution) {
      announce(`\n${JSON.stringify(user)}`);
      announce(`balances: ${JSON.stringify(balances[user[0]])}`);
      for (let tier = 1; tier <= 4; tier++) {
        const userBalance = balances[user[0]];
        let shouldBeSent = (user[tier] as number) - userBalance[tier - 1];
        check &&= shouldBeSent === 0;
        while (shouldBeSent > 0) {
          info(`Sending ${shouldBeSent} tokens of tier ${tier}`);
          // find tokenId to sent
          let tokenId = 0;
          for (tokenId = tokenIdsOffset[tier]; ; tokenId++) {
            // for (tokenId = tokenIdsOffset[tier] + sent[tier]; ; tokenId++) {
            if ((await p2Vault.ownerOf(tokenId)) == deployer) break;
          }
          assert((await p2Vault.tokenTiers(tokenId)).toNumber() === tier, `tier mismatch`);
          info(`sending tokenId ${tokenId}...`);
          if (!test) await (await p2Vault.transferFrom(deployer, user[0], tokenId)).wait();
          success(`> tokenId ${tokenId} of ${tier} sent `);
          sent[tier]++;
          shouldBeSent--;
        }
      }
    }
    success(`\ncheck: ${check}`);
    info(`sent ${JSON.stringify(sent)}`);
  });
