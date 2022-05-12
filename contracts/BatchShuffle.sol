// SPDX-License-Identifier: MIT
pragma solidity 0.8.4;

import "hardhat/console.sol";

/// @title Offsets
/// @notice
/// @dev
abstract contract BatchShuffle {
    uint256 internal immutable _batchSize;
    uint256 internal immutable _startShuffledId;

    mapping(uint256 => uint16) public availableIds;
    uint16 public availableCount;
    mapping(uint256 => uint256) public offsets;

    /// @notice Constructor sets contract metadata configurations and split interfaces
    constructor(
        uint16 _availableCount,
        uint256 batchSize_,
        uint256 startShuffledId_
    ) {
        availableCount = _availableCount;
        _batchSize = batchSize_;
        _startShuffledId = startShuffledId_;
    }

    function _setNextOffset(uint256 _index, uint256 _seed) internal {
        require(availableCount > 0, "Sold out");
        // This updates the entropy base for minting. Fairly simple but should work for this use case.
        // uint256 _seed = uint256(blockhash(block.number - 1)); /*Use prev block hash for pseudo randomness*/
        // Get index of ID to mint from available ids
        uint256 swapIndex = _seed % availableCount;
        // console.log(swapIndex);
        // Load in new id
        uint256 newId = availableIds[swapIndex];
        // If unset, assume equals index
        if (newId == 0) {
            newId = swapIndex;
        }
        uint16 lastIndex = availableCount - 1;
        uint16 lastId = availableIds[lastIndex];
        if (lastId == 0) {
            lastId = lastIndex;
        }
        // Set last value as swapped index
        availableIds[swapIndex] = lastId;

        availableCount--;

        offsets[_index] = newId;
    }

    /// @dev Get the token ID to use for URI of a token ID
    /// @param _tokenId Token to check
    function getShuffledTokenId(uint256 _tokenId)
        public
        view
        returns (uint256)
    {
        uint256 _batchIndex = _tokenId % _batchSize;
        uint256 _batchStart = _tokenId - _batchIndex; /*Offsets are stored for batches of 4 consecutive songs*/
        uint256 _offset = offsets[_batchStart];
        uint256 _shuffledTokenId = (_offset * _batchSize) +
            _startShuffledId +
            _batchIndex; /*Add to token ID to get shuffled ID*/

        return _shuffledTokenId;
    }
}
