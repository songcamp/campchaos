// SPDX-License-Identifier: MIT
pragma solidity 0.8.10;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Supply.sol";
import "./EIP712Allowlisting.sol";

/// @title Song Packs
/// @notice
/// @dev
contract SongPacks is ERC1155Supply, EIP712Allowlisting, Ownable {
    uint256 constant MAX_PER_MINT = 20; /*Don't let people buy more than 20 per transaction*/
    uint256 RESERVED; /*Max token ID for reserve*/
    uint256 PRESALE_LIMIT; /*Max token ID for presale- set in constructor*/
    uint256 PUBLIC_LIMIT; /*Max token ID - set in constructor*/
    uint256 constant PRESALE_PRICE = 0.05 ether; /*Discount for qualified addresses*/
    uint256 constant PUBLIC_PRICE = 0.1 ether; /*Public sale price*/

    uint256 constant PREFIX_OPENPACK = 1e24;

    using Counters for Counters.Counter;
    string public contractURI; /*contractURI contract metadata json*/

    address payable public ethSink; /*recipient for ETH*/

    // Track when presales and public sales are allowed
    enum ContractState {
        Presale,
        Public
    }
    mapping(ContractState => bool) public contractState;

    constructor(
        string memory uri_,
        string memory _contractURI,
        bytes32 _root,
        uint256 _reserved,
        uint256 _presaleLimit,
        uint256 _publicSaleLimit,
        address payable _sink
    ) ERC1155(uri_) EIP712Allowlisting("SongPacks") {
        ethSink = _sink;
        contractURI = _contractURI;

        RESERVED = _reserved;
        PRESALE_LIMIT = _presaleLimit;
        PUBLIC_LIMIT = _publicSaleLimit;

        _tokenIds = Counters.Counter({_value: RESERVED}); /*Start token IDs after reserved tokens*/
    }

    /*****************
    EXTERNAL MINTING FUNCTIONS
    *****************/
    /// @notice Mint presale by qualified address.
    /// @dev Presale state must be enabled
    /// @param _quantity How many tokens to buy - up to 20 at a time
    function mintPresale(
        uint256 _quantity,
        uint256 _nonce,
        bytes calldata _signature
    ) external payable requiresAllowlist(_signature, _nonce) {
        require(contractState[ContractState.Presale], "!round");
        _purchase(_quantity, PRESALE_LIMIT, PRESALE_PRICE);
    }

    /// @notice Mint pack by anyone
    /// @dev Public sale state must be enabled
    /// @param _quantity How many tokens to buy - up to 20 at a time
    function mintOpensale(uint256 _quantity) external payable {
        require(contractState[ContractState.Public], "!round");
        _purchase(_quantity, PUBLIC_LIMIT, PUBLIC_PRICE);
    }

    /// @notice Mint special reserve by owner
    /// @param _quantity How many tokens to mint
    function mintReserve(uint256 _quantity, address _to) external onlyOwner {
        require(
            (_reservedTokenIds.current() + _quantity) <= RESERVED,
            "EXCEEDS CAP"
        );
        // Workaround for solidity dynamic memory array
        address[] memory _ids = new uint256[](_quantity);
        address[] memory _amounts = new uint256[](_quantity);
        for (uint256 _i = 0; _i < _quantity; _i++) {
            _reservedTokenIds.increment();

            _ids[_i] = _reservedTokenIds.current();
            _amounts[_i] = 1;
        }
        _mintBatch(_to, _ids, _amounts, ""); /*Todo is this more gas efficient than just minting in the loop?*/
    }

    function openPack(uint256 _packId) external {
        require(balanceOf(msg.sender, _packId) == 1, "!owner");
        _burn(msg.sender, _packId, 1);
        _mintSongs(_packId, msg.sender);
        _mint(msg.sender, PREFIX_OPENPACK + _packId, 1, ""); /*Generate opened pack token*/
    }

    /*****************
    INTERNAL MINTING FUNCTIONS AND HELPERS
    *****************/
    /// @notice Mint tokens and transfer eth to sink
    /// @dev Validations:
    ///      - Msg value is checked in comparison to price and quantity
    ///      - Quantity is checked in comparison to max per mint
    ///      - Quantity is checked in comparison to max supply
    /// @param _quantity How many tokens to mint
    /// @param _limit Limit for tokenIDs
    /// @param _price Price per token
    function _purchase(
        address _to,
        uint256 _quantity,
        uint256 _limit,
        uint256 _price
    ) internal {
        require((_tokenIds.current() + _quantity) <= _limit, "EXCEEDS CAP"); /*Check max new token ID compared to total cap*/
        require(_quantity <= MAX_PER_MINT, "TOO MUCH"); /*Check requested qty vs max*/
        require(msg.value >= _price * _quantity, "NOT ENOUGH"); /*Check if enough ETH sent*/

        (bool _success, ) = ethSink.call{value: msg.value}(""); /*Send ETH to sink first*/
        require(_success, "could not send");

        if (_quantity == 1) {
            _tokenIds.increment();
            _mint(_to, _tokenIds.current(), 1, "");
        } else if (_quantity > 1) {
            // Workaround for solidity dynamic memory array
            address[] memory _ids = new uint256[](_quantity);
            address[] memory _amounts = new uint256[](_quantity);
            for (uint256 _i = 0; _i < _quantity; _i++) {
                _tokenIds.increment();

                _ids[_i] = _tokenIds.current();
                _amounts[_i] = 1;
            }
            _mintBatch(_to, _ids, _amounts, ""); /*Todo is this more gas efficient than just minting in the loop?*/
        }
    }

    function _mintSongs(uint256 _packId, address _dst) internal {
        uint256 _songCount = 4; // TODO base on RNG & Rarity table
        for (uint256 _i = 0; _i < array.length; _i++) {
            uint256 _songId = _i; //TODO base on RNG & Rarity table. Make sure you can't get duplicate songs
            _mint(_dst, _songId, 1, ""); /*Send songs to pack opener*/
        }
    }

    /*****************
    CONFIG FUNCTIONS
    *****************/

    /// @notice Set states enabled or disabled as owner
    /// @param _state 0: presale, 1: public sale
    /// @param _enabled specified state on or off
    function setContractState(ContractState _state, bool _enabled)
        external
        onlyOwner
    {
        contractState[_state] = _enabled;
    }

    /// @notice Set the base URI
    /// @param uri_ Base URI
    function setURI(string memory uri_) external onlyOwner {
        _setURI(uri_);
    }

    /// @notice Set new contract URI
    /// @param _contractURI Contract metadata json
    function setContractURI(string memory _contractURI) external onlyOwner {
        contractURI = _contractURI;
    }

    /*****************
    Public interfaces
    *****************/
    ///@dev Support interfaces for ERC1155
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC1155)
        returns (bool)
    {
        return
            interfaceId == type(IERC1155).interfaceId ||
            interfaceId == type(IERC1155MetadataURI).interfaceId ||
            super.supportsInterface(interfaceId);
    }
}
