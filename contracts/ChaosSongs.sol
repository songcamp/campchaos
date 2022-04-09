// SPDX-License-Identifier: MIT
pragma solidity 0.8.4;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import {SafeTransferLib} from "@rari-capital/solmate/src/utils/SafeTransferLib.sol";
import "./ChaosPacks.sol";
import "./external/interfaces/ISplitMain.sol";
import "./external/erc721a/extensions/ERC721ABurnable.sol";
import "./bits.sol";

import "hardhat/console.sol";

/// @title Chaos Songs
/// @notice
/// @dev
contract ChaosSongs is ERC721ABurnable, Ownable, BitwiseUtils {
    uint256 constant SONG_COUNT = 4;
    uint32 constant PERCENTAGE_SCALE = 1e3; /* 1e6 / 1e3, where 1e3 is the supply of supercharged NFTs */
    uint256 constant MAX_SUPPLY = 21e3;

    // uint256 constant MAX_INT =
    //     0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff;
    // uint256 constant BITS_136 = 0xffffffffffffffffffffffffffffffffff;

    uint256 constant NUM_BITSTRINGS = 100; // 5000 / 256 + 1
    // uint256 constant MAX_BITSTRING_LENGTH = 136; // 5000 % 256 remainder

    ChaosPacks public packContract;

    mapping(uint256 => uint256) offsets;
    

    bytes32[100] public unclaimed;
    mapping (uint256 => uint256) numTaken;

    mapping(uint256 => uint256) public tokenSongs;
    mapping(address => uint32) public superchargeBalances;

    using SafeTransferLib for address payable;
    using Strings for uint256;

    using Counters for Counters.Counter;
    Counters.Counter private _reservedTokenIds; /*Tokens 1-> PERCENTAGE_SCALE*/
    Counters.Counter private _tokenIds; /*Tokens RESERVE + 1 -> PUBLIC_LIMIT*/

    address payable public payoutSplit; /* 0xSplits address for split */
    ISplitMain public splitMain; /* 0xSplits address for updating & distributing split */
    uint32 internal distributorFee; /* 0xSplits distributorFee payable to third parties covering gas of distribution */

    string public contractURI; /*contractURI contract metadata json*/

    string public baseURI; /*baseURI_ String to prepend to token IDs*/

    constructor(
        string memory baseURI_,
        string memory _contractURI,
        address _splitMain,
        uint32 _distributorFee
    ) ERC721A("Song Camp Chaos Songs", "SCCS") {
        contractURI = _contractURI;
        _setBaseURI(baseURI_);

        splitMain = ISplitMain(_splitMain);

        splitMain = ISplitMain(_splitMain);

        // create dummy mutable split with this contract as controller;
        // recipients & distributorFee will be updated on first payout
        // might be easier to pass this in as calldata in constructor?
        address[] memory recipients = new address[](2);
        recipients[0] = address(0);
        recipients[1] = address(1);
        uint32[] memory percentAllocations = new uint32[](2);
        percentAllocations[0] = uint32(500000);
        percentAllocations[1] = uint32(500000);
        payoutSplit = payable(
            splitMain.createSplit(
                recipients,
                percentAllocations,
                0,
                address(this)
            )
        );

        distributorFee = _distributorFee;

        distributorFee = _distributorFee;

        _tokenIds = Counters.Counter({_value: PERCENTAGE_SCALE}); /*Start token IDs after reserved tokens*/

        // for (uint256 index = 0; index < 100; index++) {
        //     unchecked {
        //         unclaimed.push(MAX_BYTES32);
        //     }
        // }
    }

    /*****************
    EXTERNAL MINTING FUNCTIONS
    *****************/

    function openPack(uint256 _packId) external {
        require(packContract.ownerOf(_packId) == msg.sender, "!owner");
        packContract.burnPack(_packId);
        _mintSongs(msg.sender);
    }

    // TODO batch mint
    function mintSupercharged(address _to, uint256 _amount) external onlyOwner {
        require(
            (_reservedTokenIds.current() + _amount) <= PERCENTAGE_SCALE,
            "EXCEEDS CAP"
        );
        for (uint256 index = 0; index < _amount; index++) {
            _mintReserved(_to);
        }
    }
    
    // function _getDiffOffset(uint256 _seed) internal returns (uint256) {
    //     uint256 _bitstringIndex = _seed % NUM_BITSTRINGS;
    //     // console.log("bitstringIndex %s", _bitstringIndex);
    //     while (unclaimed[_bitstringIndex] == 0) {
    //         // Check if depleted
    //         if (_bitstringIndex == NUM_BITSTRINGS - 1)
    //             _bitstringIndex = 0; // Roll over to index 0
    //         else _bitstringIndex++; // Check the next highest bitstring
    //     }
        
    // }

    function _getNextOffset(uint256 _seed) internal returns (uint256) {
        uint256 _bitstringIndex = _seed % NUM_BITSTRINGS;
        // console.log("bitstringIndex %s", _bitstringIndex);
        while (unclaimed[_bitstringIndex] == MAX_BYTES32) {
            // Check if depleted
            if (_bitstringIndex == NUM_BITSTRINGS - 1)
                _bitstringIndex = 0; // Roll over to index 0
            else _bitstringIndex++; // Check the next highest bitstring
        }

        /*_bitstringIndex now has a non-depleted selection*/

        uint256 _bitstringMax = 49; /*Set parameter for modding the seed*/

        // console.log("Taken %s, bitstring %s", numTaken[_bitstringIndex], _bitstringIndex);
        uint256 _bitstringInternalIndex = _seed % (_bitstringMax + 2 - numTaken[_bitstringIndex]);
        
        uint256 _internalCounter = 0;
        
        uint256 index;

        for (index = 0; index <= _bitstringMax; index++) {
            if (getBit(unclaimed[_bitstringIndex], index) == false) {
                _internalCounter++;
            }
            if (_internalCounter == (_bitstringInternalIndex + 1)) {
                // require(getBit(unclaimed[_bitstringIndex], index) == false, "Taken");
                unclaimed[_bitstringIndex] = setBit(
                    unclaimed[_bitstringIndex],
                    index
                );
                break;
            }
        }
        
        

        // while (
        //     getBit(unclaimed[_bitstringIndex], _bitstringInternalIndex) // Check if bit is claimed
        // ) {
        //     // console.log("Checking index, internal %s, %s", _bitstringIndex, _bitstringInternalIndex);
        //     if (_bitstringInternalIndex == _bitstringMax)
        //         _bitstringInternalIndex = 0; // Roll over to index 0
        //     else _bitstringInternalIndex++; // Check the next highest index
        // }

        /* _bitstringInternalIndex now has an unclaimed pick*/

        // Mark the bit as claimed
        // unclaimed[_bitstringIndex] = setBit(
        //     unclaimed[_bitstringIndex],
        //     _bitstringInternalIndex
        // );
        
        numTaken[_bitstringIndex]++;

        // Return the total index to use as the pack offset
        return ((_bitstringIndex * 50) + index);
    }

    /*****************
    INTERNAL MINTING FUNCTIONS AND HELPERS
    *****************/
    function _mintSongs(address _to) internal {
        _safeMint(_to, SONG_COUNT);

        // Find unused offset
        uint256 _seed = uint256(blockhash(block.number - 1));

        uint256 _offset = _getNextOffset(_seed);
        
        console.log("offset %s", _offset);

        offsets[_currentIndex] = _offset;
    }

    function getShuffledTokenId(uint256 _tokenId)
        public
        view
        returns (uint256)
    {
        require(_exists(_tokenId));
        uint256 _floor = _tokenId - (_tokenId % 4);
        uint256 _offset = offsets[_floor];
        return ((_offset * 4) + _tokenId);
    }

    /// @notice Mint tokens from reserve
    /// @dev Token IDs come from separate pool at beginning of counter
    /// @param _to Recipient of reserved tokens
    function _mintReserved(address _to) internal {
        // TODO fix now with ERC721A
        // _reservedTokenIds.increment();

        // uint256 _id = _reservedTokenIds.current();
        _safeMint(_to, 1);
    }

    /*****************
    DISTRIBUTION FUNCTIONS
    *****************/

    /// @notice distributes ETH to supercharged NFT holders
    /// @param accounts Ordered, unique list of supercharged NFT tokenholders
    /// @param distributorAddress Address to receive distributorFee
    function distributeETH(
        address[] calldata accounts,
        address distributorAddress
    ) external {
        uint256 numRecipients = accounts.length;
        uint32[] memory percentAllocations = new uint32[](numRecipients);
        for (uint256 i = 0; i < numRecipients; ) {
            // TODO (wm): ideally could access balances directly to save gas
            // for this use case, the require check against the zero address is irrelevant & adds gas
            percentAllocations[i] =
                superchargeBalances[accounts[i]] *
                PERCENTAGE_SCALE;
            unchecked {
                ++i;
            }
        }

        // atomically deposit funds into split, update recipients to reflect current supercharged NFT holders,
        // and distribute
        payoutSplit.safeTransferETH(address(this).balance);
        splitMain.updateAndDistributeETH(
            payoutSplit,
            accounts,
            percentAllocations,
            distributorFee,
            // TODO (wm): should distributorAddress have a fallback?
            // tx.origin or msg.sender if === Address(0)?
            distributorAddress
        );

        // TODO (wm): emit event?
    }

    /*****************
    CONFIG FUNCTIONS
    *****************/

    // TODO lock song contract address?
    function setPackContract(address _packContract) external onlyOwner {
        packContract = ChaosPacks(_packContract);
    }

    /// @notice internal helper to update token URI
    /// @param baseURI_ String to prepend to token IDs
    function _setBaseURI(string memory baseURI_) internal {
        baseURI = baseURI_;
    }

    /// @notice Set new contract URI
    /// @param _contractURI Contract metadata json
    function setContractURI(string memory _contractURI) external onlyOwner {
        contractURI = _contractURI;
    }

    /// @notice Set distributorFee as owner
    /// @param _distributorFee 0xSplits distributorFee payable to third parties covering gas of distribution
    function setDistributorFee(uint32 _distributorFee) external onlyOwner {
        distributorFee = _distributorFee;
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override
        returns (string memory)
    {
        uint256 _shuffled = getShuffledTokenId(tokenId);
        require(
            _exists(tokenId),
            "ERC721Metadata: URI query for nonexistent token"
        );

        return
            bytes(baseURI).length > 0
                ? string(
                    abi.encodePacked(baseURI, _shuffled.toString(), ".json")
                )
                : "";
    }

    function _beforeTokenTransfers(
        address from,
        address to,
        uint256 startTokenId,
        uint256 quantity
    ) internal override(ERC721A) {
        super._beforeTokenTransfers(from, to, startTokenId, quantity);
        if (startTokenId <= PERCENTAGE_SCALE) {
            require(to != address(0)); /*Disallow burning of supercharged tokens*/
            if (from != address(0)) {
                superchargeBalances[from]--;
            }
            superchargeBalances[to]++;
        }
    }

    receive() external payable {}
}
