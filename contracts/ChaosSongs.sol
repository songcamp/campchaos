// SPDX-License-Identifier: MIT
pragma solidity 0.8.10;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "./EIP712Allowlisting.sol";
import "./ChaosPacks.sol";

/// @title Chaos Songs
/// @notice
/// @dev
contract ChaosSongs is ERC721, EIP712Allowlisting, Ownable {
    uint256 constant SONG_COUNT = 36;
    uint256 RESERVED; /*Max token ID for supercharged reserve*/
    uint256 PUBLIC_LIMIT; /*Max token ID - set in constructor*/

    ChaosPacks public packContract;

    mapping(uint256 => uint256) public tokenSongs;
    mapping(address => uint256) public superchargeBalances;

    mapping (uint256 => bool) private _duplicateChecker;

    using Counters for Counters.Counter;
    Counters.Counter private _reservedTokenIds; /*Tokens 1-> RESERVED*/
    Counters.Counter private _tokenIds; /*Tokens RESERVE + 1 -> PUBLIC_LIMIT*/

    string public contractURI; /*contractURI contract metadata json*/

    constructor(
        string memory uri_,
        string memory baseURI_,
        string memory _contractURI,
        uint256 _reserved,
        uint256 _limit
    ) ERC721("Song Camp Chaos Songs", "SCCS") {
        contractURI = _contractURI;
        _setBaseURI(baseURI_);

        RESERVED = _reserved;
        PUBLIC_LIMIT = _limit;

        _tokenIds = Counters.Counter({_value: RESERVED}); /*Start token IDs after reserved tokens*/
    }

    /*****************
    EXTERNAL MINTING FUNCTIONS
    *****************/

    function openPack(uint256 _packId) external {
        require(packContract.ownerOf(_packId) == msg.sender, "!owner");
        packContract.burnPack(_packId);
        _mintSongs(_packId, msg.sender);
    }

    // TODO batch mint
    function mintSupercharged(address _to) external onlyOwner {
        _mintReserved(_to);
    }

    /*****************
    INTERNAL MINTING FUNCTIONS AND HELPERS
    *****************/
    function _mintSongs(uint256 _packId, address _to) internal {
        uint256 _songCount = 4; // TODO base on RNG & Rarity table
        uint256 _seed = _getSeed(_packId);
        address[] memory _ids = new uint256[](_songCount);
        for (uint256 _i = 0; _i < _songCount; _i++) {
            uint256 _songId = _getSongId(_seed, 0);
            _ids[_i] = _songId; /*Temporarily store to prevent duplicates*/
            _duplicateChecker[_songId] = true;

            uint256 _tokenId = _mintItem(_to);
            songTokens[_tokenId] = _songId;
        }
        for (uint256 _i = 0; _i < _ids.length; _i++) {
          _duplicateChecker[_ids[_i]] = false; /*Unset temporary storage*/
        }
        _mintBatch(_to, _ids, 1, ""); /*Send songs to pack opener*/
    }

    function _getSeed(uint256 _packId) internal returns (uint256) {
        unchecked {
            uint256 _seed = uint256(block.blockhash(block.number - 1)) *
                _packId;
        }
        return _seed;
    }

    function _getSongId(uint256 _seed, uint256 _retry)
        internal
        pure
        returns (uint256 _songId)
    {
        _songId = ((_seed / (10**_i)) + _retry) % SONG_COUNT;
        if (_duplicateChecker[_songId]) {
          _songId = _getSongId(_seed, _retry + 1);
        }
    }

    /// @notice Mint tokens from presale and public pool
    /// @dev Token IDs come from separate pool after reserve
    /// @param _to Recipient of reserved tokens
    function _mintItem(address _to) internal returns (uint256) {
        _tokenIds.increment();

        uint256 _id = _tokenIds.current();
        _safeMint(_to, _id);
        return _id;
    }

    /// @notice Mint tokens from reserve
    /// @dev Token IDs come from separate pool at beginning of counter
    /// @param _to Recipient of reserved tokens
    function _mintReserved(address _to) internal {
        _reservedTokenIds.increment();

        uint256 _id = _reservedTokenIds.current();
        _safeMint(_to, _id);
    }
    
    // TODO balance of supercharged

    /*****************
    CONFIG FUNCTIONS
    *****************/

    // TODO lock song contract address?
    function setPackContract(address _packContract) external onlyOwner {
        packContract = ChaosPack(_packContract);
    }

    /// @notice internal helper to retrieve private base URI for token URI construction
    function _baseURI() internal view override returns (string memory) {
        return baseURI;
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

        string memory baseURI = _baseURI();
        return
            bytes(baseURI).length > 0
                ? string(abi.encodePacked(baseURI, tokenId.toString(), ".json"))
                : "";
    }
}
