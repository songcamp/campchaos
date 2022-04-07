// SPDX-License-Identifier: MIT
pragma solidity 0.8.4;

/// @title Mock Chaos Packs
/// @notice
/// @dev
contract MockChaosPacks {
    uint256 private _variable;
    
    address private _tokenOwner;
    
    function setOwner(address _owner) external {
      _tokenOwner = _owner;
    }

    function ownerOf(uint256 _tokenId) external view returns (address) {
        return _tokenOwner;
    }

    function burnPack(uint256 _packId) external {
        _variable = _packId;
    }
}
