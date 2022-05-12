// SPDX-License-Identifier: MIT
pragma solidity 0.8.4;

import "../BatchShuffle.sol";

contract ShuffleTester is BatchShuffle {
    constructor(
        uint16 _availableCount,
        uint256 _batchSize,
        uint256 _startShuffleId
    ) BatchShuffle(_availableCount, _batchSize, _startShuffleId) {}

    function setOffsetManual(uint256 _offsetIndex, uint256 _offset) public {
        offsets[_offsetIndex] = _offset;
    }

    function setOffsetSeed(uint256 _offsetIndex, uint256 _seed) public {
        _setNextOffset(_offsetIndex, _seed);
    }

    function setRandomOffset(uint256 _offsetIndex) public {
        uint256 _seed = uint256(blockhash(block.number - 1)); /*Use prev block hash for pseudo randomness*/
        _setNextOffset(_offsetIndex, _seed);
    }
}
