// SPDX-License-Identifier: MIT
pragma solidity 0.8.4;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import {SafeTransferLib} from "@rari-capital/solmate/src/utils/SafeTransferLib.sol";
import "./ChaosPacks.sol";
import "./external/interfaces/ISplitMain.sol";
import "./external/erc721a/extensions/ERC721ABurnable.sol";
import "./bits.sol";

import "hardhat/console.sol";

error MaxSupplyExceeded();
error CallerIsNotTokenOwner();
error PacksDisabledUntilSuperchargedComplete();
error SuperchargedOffsetAlreadySet();
error SuperchargeConfigurationNotReady();
error SuperchagedOffsetNotSet();

/// @title Chaos Songs
/// @notice
/// @dev
contract ChaosSongs is ERC721ABurnable, Ownable, BitwiseUtils {
    uint256 constant SONG_COUNT = 4; /* Number of songs minted on pack open*/
    uint32 constant SUPERCHARGED_SUPPLY = 1e3; /* 1e6 / 1e3, where 1e3 is the supply of supercharged NFTs */
    uint256 constant MAX_SUPPLY = 21e3; /* Max token ID for both supercharged and regular*/

    /* 
    Random offset configuration
    100 * 50 = 5000 packs
    */
    uint256 constant NUM_BITSTRINGS = 100; /*100 bitstrings to keep track of claimed offsets*/
    uint256 constant BITSTRING_LENGTH = 50; /* */

    mapping(uint256 => uint256) offsets;

    bytes32[100] public unclaimed;
    mapping(uint256 => uint256) numTaken;

    bool public superchargedOffsetIsSet; /*Track if supercharged offset is set to disallow pack opening and cause token ID issues*/
    uint256 public superchargedOffset; /*Track offset for first 1000 NFTs separately*/

    ChaosPacks public packContract; /*External contract to use for pack NFTs*/

    /*Liquid splits config*/
    using SafeTransferLib for address payable;
    mapping(address => uint32) public superchargeBalances; /*Track supercharged balance separately for liquid splits*/
    address payable public payoutSplit; /* 0xSplits address for split */
    ISplitMain public splitMain; /* 0xSplits address for updating & distributing split */
    uint32 internal distributorFee; /* 0xSplits distributorFee payable to third parties covering gas of distribution */

    /*Contract config*/
    using Strings for uint256;
    string public contractURI; /*contractURI contract metadata json*/
    string public baseURI; /*baseURI_ String to prepend to token IDs*/

    // TODO ERC2981 for royalties

    /// @notice Constructor sets contract metadata configurations and split interfaces
    /// @param baseURI_ Base URI for token metadata
    /// @param _contractURI URI for marketplace contract metadata
    /// @param _splitMain Address of splits contract for sending royalties
    /// @param _distributorFee Optional fee to compensate address calling distribute, offset gas
    constructor(
        string memory baseURI_,
        string memory _contractURI,
        address _splitMain,
        uint32 _distributorFee
    ) ERC721A("Song Camp Chaos Songs", "SCCS") {
        _setBaseURI(baseURI_); /*Set token level metadata*/
        contractURI = _contractURI; /*Set marketplace metadata*/

        splitMain = ISplitMain(_splitMain); /*Establish interface to splits contract*/

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

        distributorFee = _distributorFee; /*Set optional fee for calling distribute*/
    }

    /*****************
    EXTERNAL MINTING FUNCTIONS
    *****************/

    /// @dev Burn a pack and receive 4 song NFTs in exchange
    /// @param _packId Pack owned by sender
    function openPack(uint256 _packId) external {
        if (packContract.ownerOf(_packId) != msg.sender)
            /*Only pack owner can open pack*/
            revert CallerIsNotTokenOwner();

        if (!superchargedOffsetIsSet)
            /*Pack opening disabled until supercharged tokensa are configured*/
            revert PacksDisabledUntilSuperchargedComplete();

        packContract.burnPack(_packId); /*Opening a pack burns the pack NT*/
        _mintSongs(msg.sender); /*Mint 4 songs to opener*/
    }

    /*****************
    Permissioned Minting
    *****************/
    /// @dev Mint the supercharged tokens to proper destination
    /// @param _to Recipient
    /// @param _amount Number of tokens to send
    // TODO distribute via a different contract?
    function mintSupercharged(address _to, uint256 _amount) external onlyOwner {
        if ((totalSupply() + _amount > SUPERCHARGED_SUPPLY))
            revert MaxSupplyExceeded(); /*Revert if max supply exceeded*/
        _safeMint(_to, _amount); /*Batch mint*/
    }

    /*****************
    RNG Config
    *****************/
    /// @dev Should be done AFTER distribution, BEFORE pack opening
    function setSuperchargedOffset() external onlyOwner {
        if (superchargedOffsetIsSet) revert SuperchargedOffsetAlreadySet(); /*Can only be set once*/
        if (totalSupply() != SUPERCHARGED_SUPPLY)
            /*Must be done after supercharge minting is complete before pack opening*/
            revert SuperchargeConfigurationNotReady();

        uint256 _seed = uint256(blockhash(block.number - 1)); /*Use prev block hash for pseudo randomness*/

        superchargedOffset = _seed % SUPERCHARGED_SUPPLY; /*Mod seed by supply to get offset*/

        superchargedOffsetIsSet = true; /*Set offset so pack opening can begin and disable this function*/
    }

    /*****************
    Internal RNG functions
    *****************/

    /// @notice Get an unused offset
    /// @dev Use seed to find a bitstring with available offset indices
    ///      Use the same seed to get the position within that bitstring
    /// @param _seed Pseudo-random or random number to use
    function _getNextOffset(uint256 _seed) internal returns (uint256) {
        uint256 _bitstringIndex = _seed % NUM_BITSTRINGS; /*Get initial bitstring to check*/
        /* Check if depleted */
        while (unclaimed[_bitstringIndex] == MAX_BYTES32) {
            if (_bitstringIndex == NUM_BITSTRINGS - 1)
                /* Roll over to index 0 */
                _bitstringIndex = 0;
            else _bitstringIndex++; /* Check the next highest bitstring */
        }

        /*_bitstringIndex now has a non-depleted selection*/
        bytes32 _bitstring = unclaimed[_bitstringIndex];

        uint256 _bitstringMax = BITSTRING_LENGTH - 1; /*Set parameter for modding the seed*/

        /*Get the index within untaken slots*/
        uint256 _bitstringInternalIndex = _seed %
            (_bitstringMax + 2 - numTaken[_bitstringIndex]);

        uint256 _internalCounter = 0; /*Initialize a counter to check when we reach the untaken slot*/

        uint256 _index; /*Initialize the index for the search*/

        /*Search the bitstring for the nth unclaimed spot*/
        for (_index = 0; _index <= _bitstringMax; _index++) {
            /*Only increment if this is an untaken spot*/
            if (getBit(_bitstring, _index) == false) {
                _internalCounter++;
            }

            /*Check if we have reached our target*/
            if (_internalCounter == (_bitstringInternalIndex + 1)) {
                // TODO check for collision?
                // require(getBit(unclaimed[_bitstringIndex], index) == false, "Taken");
                unclaimed[_bitstringIndex] = setBit(_bitstring, _index); /*Mark index as taken*/
                break;
            }
        }

        numTaken[_bitstringIndex]++; /*Increment the number we have taken so we mod by 1 less next time*/

        // Return the total index to use as the pack offset
        return ((_bitstringIndex * BITSTRING_LENGTH) + _index);
    }

    /// @dev Get the token ID to use for URI of a token ID
    /// @param _tokenId Token to check
    function getShuffledTokenId(uint256 _tokenId)
        public
        view
        returns (uint256)
    {
        if (!_exists(_tokenId)) revert URIQueryForNonexistentToken(); /*Only return for minted tokens*/
        uint256 _shuffledTokenId; /*Initialize shuffled token ID*/

        /*If not supercharged use individual offsets*/
        if (_tokenId > SUPERCHARGED_SUPPLY) {
            uint256 _floor = _tokenId - (_tokenId % SONG_COUNT); /*Offsets are stored for batches of 4 consecutive songs*/
            uint256 _offset = offsets[_floor] * SONG_COUNT; /*Multiply by song count to get offset*/
            _shuffledTokenId = _offset + _tokenId; /*Add to token ID to get shuffled I?D*/

            /*Check if exceeds max supply*/
            if (_shuffledTokenId > MAX_SUPPLY) {
                _shuffledTokenId -= (MAX_SUPPLY + SUPERCHARGED_SUPPLY); /*Roll over to beginning of non-supercharged NFTs*/
            }
        } else {
            /*If supercharged use the supercharged offset*/
            if (!superchargedOffsetIsSet) revert SuperchagedOffsetNotSet(); /*Require that offset is set for this to return*/
            _shuffledTokenId = superchargedOffset + _tokenId; /*Supercharged offset is same for all tokens*/

            /*Check if exceeds max supply*/
            if (_shuffledTokenId > SUPERCHARGED_SUPPLY) {
                _shuffledTokenId -= SUPERCHARGED_SUPPLY; /*Roll over to beginning*/
            }
        }

        return _shuffledTokenId;
    }

    /*****************
    INTERNAL MINTING FUNCTIONS AND HELPERS
    *****************/
    function _mintSongs(address _to) internal {
        _safeMint(_to, SONG_COUNT);

        // Find unused offset
        uint256 _seed = uint256(blockhash(block.number - 1));

        uint256 _offset = _getNextOffset(_seed);

        offsets[_currentIndex] = _offset;
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
                SUPERCHARGED_SUPPLY;
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
    function _startTokenId() internal view override returns (uint256) {
        return 1;
    }

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
        if (startTokenId <= SUPERCHARGED_SUPPLY) {
            require(to != address(0)); /*Disallow burning of supercharged tokens*/
            if (from != address(0)) {
                superchargeBalances[from]--;
            }
            superchargeBalances[to]++;
        }
    }

    receive() external payable {}
}
