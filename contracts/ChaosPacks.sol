// SPDX-License-Identifier: MIT
pragma solidity 0.8.4;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "./external/erc721a/ERC721A.sol";

error OnlyOneCallPerBlockForNonEOA();
error SaleDisabled();
error MaxSupplyExceeded();
error MaxReserveExceeded();
error MaxPerTxExceeded();
error InvalidPurchaseValue();
error OnlySongContractCanBurn();

/// @title Chaos Packs
/// @notice Sale contract for Songcamp Chaos Packs
contract ChaosPacks is ERC721A, Ownable {
    uint256 constant MAX_PER_MINT = 5; /*Don't let people buy more than 5 per transaction*/
    uint256 RESERVED; /*Max token ID for reserve*/
    uint256 MAX_SUPPLY; /*Max token ID - set in constructor*/
    uint256 constant public PRICE = 0.2 ether; /*Public sale price*/

    address public songContract; /*Address that can burn packs to open them*/

    using Strings for uint256;

    string public contractURI; /*contractURI contract metadata json*/

    address payable public ethSink; /*recipient for ETH*/
    string public baseURI; /*baseURI_ String to prepend to token IDs*/

    bool public saleEnabled; /*Sale disabled by default*/

    mapping(address => uint256) lastCallFrom; /*Track last call to prevent contract bots*/

    modifier oncePerBlock() {
        if (msg.sender != tx.origin) {
            /*If caller is a contract only allow one call per block*/
            if (lastCallFrom[tx.origin] == block.number) {
                revert OnlyOneCallPerBlockForNonEOA();
            }
            lastCallFrom[tx.origin] = block.number; /*Store block to check on next mint*/
        }
        _;
    }

    /// @notice Constructor sets contract metadata configurations and sale configurations
    /// @param baseURI_ Base URI for token metadata
    /// @param _contractURI URI for marketplace contract metadata
    /// @param _reserved Max amount that can be minted by admin
    /// @param _maxSupply Max amount that can be minted total
    /// @param _sink Destination for sale ETH
    constructor(
        string memory baseURI_,
        string memory _contractURI,
        uint256 _reserved,
        uint256 _maxSupply,
        address payable _sink
    ) ERC721A("Chaos Packs", "PACKS") {
        ethSink = _sink; /*Set the ETH destination - should be immutable split*/
        contractURI = _contractURI; /*Set contract metadata*/
        _setBaseURI(baseURI_); /*Set token metadata*/

        RESERVED = _reserved; /*Set max admin mint*/
        MAX_SUPPLY = _maxSupply; /*Set max total mint*/
    }

    /*****************
    EXTERNAL MINTING FUNCTIONS
    *****************/
    /// @notice Mint pack by anyone
    /// @dev Sale state must be enabled
    /// @param _quantity How many tokens to buy - up to 5 at a time
    function purchase(uint256 _quantity) external payable oncePerBlock {
        if (!saleEnabled) revert SaleDisabled(); /*Sale must be enabled*/
        if (msg.value != (PRICE * _quantity)) revert InvalidPurchaseValue(); /*Purchase price must be exact*/
        if ((totalSupply() + _quantity) > MAX_SUPPLY)
            revert MaxSupplyExceeded(); /*Check against max supply*/
        if (_quantity > MAX_PER_MINT) revert MaxPerTxExceeded(); /*Check against max per mint*/

        (bool _success, ) = ethSink.call{value: msg.value}(""); /*Send ETH to sink first*/
        require(_success, "could not send");

        _safeMint(msg.sender, _quantity); /*Mint packs to sender*/
    }

    /// @notice Mint special reserve by owner
    /// @param _quantity How many tokens to mint
    function mintReserve(uint256 _quantity, address _to) external onlyOwner {
        if ((totalSupply() + _quantity) > RESERVED) revert MaxReserveExceeded(); /*Check against max admin mint*/
        if ((totalSupply() + _quantity) > MAX_SUPPLY)
            /*Check against max supply*/
            revert MaxSupplyExceeded();
        _safeMint(_to, _quantity); /*Mint packs to specified destination*/
    }

    /*****************
    PACK OPENING
    *****************/
    /// @notice Burn pack by song contract
    /// @param _packId Which pack to burn
    function burnPack(uint256 _packId) external returns (bool) {
        if (msg.sender != songContract) revert OnlySongContractCanBurn(); /*Packs can only be burned by opening in song contract*/
        _burn(_packId); /*Burn the pack*/
        return true;
    }

    /*****************
    CONFIG FUNCTIONS
    *****************/
    /// @notice Set sale proceeds address
    /// @param _sink new sink
    function setSink(address payable _sink) external onlyOwner {
        ethSink = _sink;
    }

    /// @notice Set states enabled or disabled as owner
    /// @param _enabled specified state on or off
    function setSaleEnabled(bool _enabled) external onlyOwner {
        saleEnabled = _enabled;
    }

    // TODO lock song contract address?
    /// @notice Set song contract as owner
    /// @param _songContract Song contract address
    function setSongContract(address _songContract) external onlyOwner {
        songContract = _songContract;
    }

    /// @notice Set new base URI
    /// @param baseURI_ String to prepend to token IDs
    function setBaseURI(string memory baseURI_) external onlyOwner {
        _setBaseURI(baseURI_);
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
        if (!_exists(tokenId)) revert URIQueryForNonexistentToken();

        return
            bytes(baseURI).length > 0
                ? string(abi.encodePacked(baseURI, tokenId.toString(), ".json"))
                : "";
    }
}
