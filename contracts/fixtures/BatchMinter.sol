pragma solidity >=0.8.0;

import "../ChaosPacks.sol";
import "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";

contract BatchMinter is ERC721Holder {
    function batchPurchase(ChaosPacks _packContract, uint256 _quantity) public payable {
      uint256 _price = _packContract.PRICE();
      for (uint256 index = 0; index < _quantity; index++) {
        _packContract.purchase{value: _price}(1);
      }
    }
}
