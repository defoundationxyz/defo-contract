//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "./helpers/OwnerRecovery.sol";
import "./implementations/LpManagerImplementationPoint.sol";
import "hardhat/console.sol";

//Sole purpose of testing lp manager
contract Defo is ERC20, ERC20Burnable, Ownable, OwnerRecovery, LpManagerImplementationPoint{
    mapping(address => uint256) private _balances;
    mapping (address=>bool) isExemptFee;
    uint256 public _totalSupply = 20000*1e18;
    
    constructor() ERC20("Defo Token","DEFO"){
        _mint(owner(), _totalSupply);
        isExemptFee[owner()] = true;
    }

    /**
     * @dev See {IERC20-transferFrom}.
     *
     * Emits an {Approval} event indicating the updated allowance. This is not
     * required by the EIP. See the note at the beginning of {ERC20}.
     *
     * NOTE: Does not update the allowance if the current allowance
     * is the maximum `uint256`.
     *
     * Requirements:
     *
     * - `from` and `to` cannot be the zero address.
     * - `from` must have a balance of at least `amount`.
     * - the caller must have allowance for ``from``'s tokens of at least
     * `amount`.
     */
    function transferFrom(
        address from,
        address to,
        uint256 amount
    ) public virtual override returns (bool) {
        address spender = _msgSender();
        _spendAllowance(from, spender, amount);
        bool sellCondition = lpPoolManager.checkSelling(to);
            //   uint256 feeAmount = lpPoolManager.calculateSellTax( from, amount);
            //   console.log(sellCondition, feeAmount);
        uint amountRecived = isExemptFee[from] ? amount : _takeFee(from, to, amount);
        uint _amount = sellCondition ? amountRecived : amount;
        _transfer(from, to, _amount);
        return true;
        
    }

    function _takeFee(address _from, address _to, uint256 _amount) internal returns (uint256){
        address rewardPool = lpPoolManager.getRewardAddress();
        uint256 feeAmount = lpPoolManager.calculateSellTax(_from, _to, _amount);
        //_balances[rewardPool] = _balances[rewardPool] + feeAmount;
        console.log("Fee is: " , feeAmount);     
        _transfer(_from, rewardPool, feeAmount);
        return _amount - feeAmount;
    }
}