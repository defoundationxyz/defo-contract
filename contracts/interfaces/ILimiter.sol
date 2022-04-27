//SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;


interface ILimiter {
    function transferLog (address from, address to, uint256 amount) external returns(bool);

    function isExcludedFromObs(address _account) external view returns(bool);

    function setMaxPercentage(uint256 _newPercentage) external;

    function setTaxCollector (address newTaxCollector) external;

    function setTokenAddress (address newTokenAddress) external;

    function setLPAddress(address newLpAddress) external;

    function setLPManager(address newLpManager) external;

    function setDiamond(address _newDiamond) external;

    function setTimeframeExpiration(uint256 newTimeframeExpiration) external;

    function editWhitelist(address _address, bool _allow) external;

    function editBlocklist(address _address, bool _allow) external;
}
