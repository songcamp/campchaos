//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "./EIP712Base.sol";
import "hardhat/console.sol";

contract EIP712Allowlisting is AccessControl, EIP712Base {
    using ECDSA for bytes32;
    bytes32 public constant ALLOWLISTING_ROLE = keccak256("ALLOWLISTING_ROLE");

    bytes32 public constant MINTER_TYPEHASH =
        keccak256("Minter(address wallet,uint256 nonce)");

    // todo add quantity?

    constructor(string memory name) EIP712Base(name) {
        _setupRole(ALLOWLISTING_ROLE, msg.sender);
    }

    modifier requiresAllowlist(
        bytes calldata signature,
        uint256 nonce
    ) {
        // Verify EIP-712 signature by recreating the data structure
        // that we signed on the client side, and then using that to recover
        // the address that signed the signature for this data.
        bytes32 digest = keccak256(
            abi.encodePacked(
                "\x19\x01",
                DOMAIN_SEPARATOR,
                keccak256(abi.encode(MINTER_TYPEHASH, msg.sender, nonce))
            )
        );
        
        // Use the recover method to see what address was used to create
        // the signature on this data.
        // Note that if the digest doesn't exactly match what was signed we'll
        // get a random recovered address.
        address recoveredAddress = digest.recover(signature);
        console.log("Recovered %s", recoveredAddress);
        require(
            hasRole(ALLOWLISTING_ROLE, recoveredAddress),
            "Invalid Signature"
        );
        _;
    }
}
