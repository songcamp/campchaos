// SPDX-License-Identifier: MIT
pragma solidity 0.8.4;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "./EIP712Allowlisting.sol";
import "./external/erc721a/ERC721A.sol";

// TODO erc721a

/// @title Chaos Packs
/// @notice
/// @dev
contract ChaosPacks is ERC721A, EIP712Allowlisting, Ownable {
    uint256 constant MAX_PER_MINT = 20; /*Don't let people buy more than 20 per transaction*/
    uint256 RESERVED; /*Max token ID for reserve*/
    uint256 PRESALE_LIMIT; /*Max token ID for presale- set in constructor*/
    uint256 PUBLIC_LIMIT; /*Max token ID - set in constructor*/
    uint256 constant PRESALE_PRICE = 0.05 ether; /*Discount for qualified addresses*/
    uint256 constant PUBLIC_PRICE = 0.1 ether; /*Public sale price*/

    address public songContract;

    using Strings for uint256;

    string public contractURI; /*contractURI contract metadata json*/

    address payable public ethSink; /*recipient for ETH*/

    string public baseURI; /*baseURI_ String to prepend to token IDs*/

    // Track when presales and public sales are allowed
    enum ContractState {
        Presale,
        Public
    }
    mapping(ContractState => bool) public contractState;

    constructor(
        string memory baseURI_,
        string memory _contractURI,
        uint256 _reserved,
        uint256 _presaleLimit,
        uint256 _publicSaleLimit,
        address payable _sink
    ) ERC721A("Song Camp Chaos Packs", "SCCP") EIP712Allowlisting("SongPacks") {
        ethSink = _sink;
        contractURI = _contractURI;
        _setBaseURI(baseURI_);

        RESERVED = _reserved;
        PRESALE_LIMIT = _presaleLimit;
        PUBLIC_LIMIT = _publicSaleLimit;

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
        _purchase(msg.sender, _quantity, PRESALE_LIMIT, PRESALE_PRICE);
    }

    /// @notice Mint pack by anyone
    /// @dev Public sale state must be enabled
    /// @param _quantity How many tokens to buy - up to 20 at a time
    function mintOpensale(uint256 _quantity) external payable {
        require(contractState[ContractState.Public], "!round");
        _purchase(msg.sender, _quantity, PUBLIC_LIMIT, PUBLIC_PRICE);
    }

    /// @notice Mint special reserve by owner
    /// @param _quantity How many tokens to mint
    function mintReserve(uint256 _quantity, address _to) external onlyOwner {
        require((totalSupply() + _quantity) <= RESERVED, "EXCEEDS CAP");
        _safeMint(_to, _quantity);
    }

    function burnPack(uint256 _packId) external returns (bool){
        require(msg.sender == songContract);
        _burn(_packId);
        return true;
        // TODO event
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
        require((totalSupply() + _quantity) <= _limit, "EXCEEDS CAP"); /*Check max new token ID compared to total cap*/
        require(_quantity <= MAX_PER_MINT, "TOO MUCH"); /*Check requested qty vs max*/
        require(msg.value >= _price * _quantity, "NOT ENOUGH"); /*Check if enough ETH sent*/

        (bool _success, ) = ethSink.call{value: msg.value}(""); /*Send ETH to sink first*/
        require(_success, "could not send");

        _safeMint(_to, _quantity);
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

    // TODO lock song contract address?
    function setSongContract(address _songContract) external onlyOwner {
        songContract = _songContract;
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

        return
            bytes(baseURI).length > 0
                ? string(abi.encodePacked(baseURI, tokenId.toString(), ".json"))
                : "";
    }
    
    ///@dev Support interfaces for Access Control 
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(AccessControl, ERC721A)
        returns (bool)
    {
        return
            interfaceId == type(IAccessControl).interfaceId ||
            interfaceId == type(IERC721).interfaceId ||
            super.supportsInterface(interfaceId);
    }

}
