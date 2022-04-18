// SPDX-License-Identifier: MIT
pragma solidity 0.8.4;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import {SafeTransferLib} from "@rari-capital/solmate/src/utils/SafeTransferLib.sol";
import "./ChaosPacks.sol";
import "./external/interfaces/ISplitMain.sol";
import "./external/erc721a/extensions/ERC721ABurnable.sol";
import "./BatchShuffle.sol";
import "./Royalties/ERC2981/IERC2981Royalties.sol";

import "hardhat/console.sol";

error MaxSupplyExceeded();
error CallerIsNotTokenOwner();
error PacksDisabledUntilSuperchargedComplete();
error SuperchargedOffsetAlreadySet();
error SuperchargeConfigurationNotReady();
error SuperchagedOffsetNotSet();
error InvalidOffset();
error LengthMismatch();
error BurnPackFailed();

/// @title Chaos Songs
/// @notice
/// @dev
contract ChaosSongs is
    ERC721ABurnable,
    Ownable,
    BatchShuffle,
    IERC2981Royalties
{
    uint256 constant SONG_COUNT = 4; /* Number of songs minted on pack open*/
    uint32 constant SUPERCHARGED_SUPPLY = 1e3; /* 1e6 / 1e3, where 1e3 is the supply of supercharged NFTs */
    uint256 constant MAX_SUPPLY = 21e3; /* Max token ID for both supercharged and regular*/
    uint16 constant PACK_SUPPLY = 5e3;

    uint256 royaltyPoints; /*Royalty percentage / 10000*/

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

    /// @notice Constructor sets contract metadata configurations and split interfaces
    /// @param baseURI_ Base URI for token metadata
    /// @param _contractURI URI for marketplace contract metadata
    /// @param _splitMain Address of splits contract for sending royalties
    /// @param _distributorFee Optional fee to compensate address calling distribute, offset gas
    constructor(
        string memory baseURI_,
        string memory _contractURI,
        address _splitMain,
        uint256 _royaltyPoints,
        uint32 _distributorFee
    )
        ERC721A("Song Camp Chaos Songs", "SCCS")
        BatchShuffle(PACK_SUPPLY, SONG_COUNT, SUPERCHARGED_SUPPLY)
    {
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

        royaltyPoints = _royaltyPoints;
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

        if (!packContract.burnPack(_packId)) revert BurnPackFailed(); /*Opening a pack burns the pack NT*/
        _mintSongs(msg.sender, _currentIndex); /*Mint 4 songs to opener*/
    }

    /*****************
    Permissioned Minting
    *****************/
    /// @dev Mint the supercharged tokens to proper destination
    /// @param _to Recipient
    /// @param _amount Number of tokens to send
    // TODO distribute via a different contract?
    function _mintSupercharged(address _to, uint256 _amount) internal {
        if ((totalSupply() + _amount > SUPERCHARGED_SUPPLY))
            revert MaxSupplyExceeded(); /*Revert if max supply exceeded*/
        _safeMint(_to, _amount); /*Batch mint*/
    }

    function mintSupercharged(address _to, uint256 _amount) external onlyOwner {
        _mintSupercharged(_to, _amount);
    }

    function batchMintSupercharged(
        address[] calldata _tos,
        uint256[] calldata _amounts
    ) external onlyOwner {
        if (_tos.length != _amounts.length) revert LengthMismatch();
        for (uint256 index = 0; index < _tos.length; index++) {
            _mintSupercharged(_tos[index], _amounts[index]);
        }
    }

    /// @notice Called with the sale price to determine how much royalty
    //          is owed and to whom.
    /// @param _tokenId - the NFT asset queried for royalty information
    /// @param _value - the sale price of the NFT asset specified by _tokenId
    /// @return _receiver - address of who should be sent the royalty payment
    /// @return _royaltyAmount - the royalty payment amount for value sale price
    function royaltyInfo(uint256 _tokenId, uint256 _value)
        external
        view
        override(IERC2981Royalties)
        returns (address _receiver, uint256 _royaltyAmount)
    {
        return (address(this), (_value * royaltyPoints) / 10000);
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

        if (superchargedOffset == 0) revert InvalidOffset();

        superchargedOffsetIsSet = true; /*Set offset so pack opening can begin and disable this function*/
    }

    /*****************
    Internal RNG functions
    *****************/

    /// @dev Get the token ID to use for URI of a token ID
    /// @param _tokenId Token to check
    function getSongTokenId(uint256 _tokenId) public view returns (uint256) {
        if (!_exists(_tokenId)) revert URIQueryForNonexistentToken(); /*Only return for minted tokens*/
        uint256 _shuffledTokenId; /*Initialize shuffled token ID*/

        /*If not supercharged use individual offsets*/
        if (_tokenId >= SUPERCHARGED_SUPPLY) {
            _shuffledTokenId = getShuffledTokenId(_tokenId);
        } else {
            /*If supercharged use the supercharged offset*/
            if (!superchargedOffsetIsSet) revert SuperchagedOffsetNotSet(); /*Require that offset is set for this to return*/
            _shuffledTokenId = superchargedOffset + _tokenId; /*Supercharged offset is same for all tokens*/

            /*Check if exceeds max supply*/
            if (_shuffledTokenId >= SUPERCHARGED_SUPPLY) {
                _shuffledTokenId -= SUPERCHARGED_SUPPLY; /*Roll over to beginning*/
            }
        }

        return _shuffledTokenId;
    }

    /*****************
    INTERNAL MINTING FUNCTIONS AND HELPERS
    *****************/
    function _mintSongs(address _to, uint256 _offsetIndex) internal {
        _safeMint(_to, SONG_COUNT);

        uint256 _seed = uint256(blockhash(block.number - 1)); /*Use prev block hash for pseudo randomness*/
        uint256 _offset = _getNextOffset(_seed);

        offsets[_offsetIndex] = _offset;
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

    // TODO lock pack contract address?
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

    /// @notice Set new base URI
    /// @dev only possible before supercharged offset is set
    /// @param baseURI_ String to prepend to token IDs
    function setBaseURI(string memory baseURI_) external onlyOwner {
        if (superchargedOffsetIsSet) revert SuperchargedOffsetAlreadySet();
        _setBaseURI(baseURI_);
    }

    /// @notice Set distributorFee as owner
    /// @param _distributorFee 0xSplits distributorFee payable to third parties covering gas of distribution
    function setDistributorFee(uint32 _distributorFee) external onlyOwner {
        distributorFee = _distributorFee;
    }

    /// @notice Set royalty points
    /// @param _royaltyPoints Royalty percentage / 10000
    function setRoyaltyPoints(uint256 _royaltyPoints) external onlyOwner {
        royaltyPoints = _royaltyPoints;
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override
        returns (string memory)
    {
        require(
            _exists(tokenId),
            "ERC721Metadata: URI query for nonexistent token"
        );
        uint256 _shuffled = getSongTokenId(tokenId);

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
        if (startTokenId < SUPERCHARGED_SUPPLY) {
            require(to != address(0)); /*Disallow burning of supercharged tokens*/
            if (from != address(0)) {
                superchargeBalances[from] -= uint32(quantity);
            }
            superchargeBalances[to] += uint32(quantity);
        }
    }

    receive() external payable {}
}
