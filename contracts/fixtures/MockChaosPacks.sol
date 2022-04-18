// SPDX-License-Identifier: MIT
pragma solidity 0.8.4;

/// @title Mock Chaos Packs
/// @notice
/// @dev
contract MockChaosPacks {
    
    bool private _burnDisabled;
    bool private _makeBurnSucceed = true;
    
    address private _tokenOwner;
    
    function setOwner(address _owner) external {
      _tokenOwner = _owner;
    }

    function ownerOf(uint256 _tokenId) external view returns (address) {
        return _tokenOwner;
    }
    
    function disableBurn(bool _disabled) external {
        _burnDisabled = _disabled;
    }

    function makeBurnSucceed(bool _succeed) external {
        _makeBurnSucceed = _succeed;
    }

    function burnPack(uint256 _packId) external returns (bool){
        require(!_burnDisabled);
        return _makeBurnSucceed;
    }
}
