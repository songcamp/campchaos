pragma solidity 0.8.4;

contract BitwiseUtils {

    // bytes32 constant MAX_BYTES32 = 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff;
    bytes32 constant MAX_BYTES32 = bytes32(uint256(0x3FFFFFFFFFFFF));
    bytes32 constant ONE = bytes32(uint256(1));
    
    function and(bytes32 a, bytes32 b) internal pure returns (bytes32) {
        return a & b;
    }
    
    function or(bytes32 a, bytes32 b) internal pure returns (bytes32) {
        return a | b;
    }
    
    function xor(bytes32 a, bytes32 b) internal pure returns (bytes32) {
        return a ^ b;
    }
    
    function negate(bytes32 a) internal pure returns (bytes32) {
        return a ^ MAX_BYTES32;
    }
    
    function shiftLeft(bytes32 a, uint256 n) internal pure returns (bytes32) {
        uint256 shifted = uint256(a) * 2 ** n;
        return bytes32(shifted);
    }
    
    // Get bit value at position
    function getBit(bytes32 a, uint256 n) internal pure returns (bool) {
        return a & shiftLeft(ONE, n) != 0;
    }
    
    // Set bit value at position
    function setBit(bytes32 a, uint256 n) internal pure returns (bytes32) {
        return a | shiftLeft(ONE, n);
    }
    
    // Set the bit into state "false"
    function clearBit(bytes32 a, uint256 n) internal pure returns (bytes32) {
        bytes32 mask = negate(shiftLeft(ONE, n));
        return a & mask;
    }
    
}