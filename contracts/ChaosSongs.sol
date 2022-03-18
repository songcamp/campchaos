// SPDX-License-Identifier: MIT
pragma solidity 0.8.10;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {SafeTransferLib} from "@rari-capital/solmate/src/utils/SafeTransferLib.sol";
import "./ChaosPacks.sol";
import "./interfaces/ISplitMain.sol";

/// @title Chaos Songs
/// @notice
/// @dev
contract ChaosSongs is ERC721, Ownable {
    uint256 constant SONG_COUNT = 36;
    uint32 constant PERCENTAGE_SCALE = 1e3; /* 1e6 / 1e3, where 1e3 is the supply of supercharged NFTs */
    uint256 PUBLIC_LIMIT; /*Max token ID - set in constructor*/

    ChaosPacks public packContract;

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
        uint256 _limit,
        address payable _payoutSplit,
        uint32 _distributorFee
    ) ERC721("Song Camp Chaos Songs", "SCCS") {
        contractURI = _contractURI;
        _setBaseURI(baseURI_);

        PUBLIC_LIMIT = _limit;

        payoutSplit = _payoutSplit;
        distributorFee = _distributorFee;

        _tokenIds = Counters.Counter({_value: PERCENTAGE_SCALE}); /*Start token IDs after reserved tokens*/
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
        require(
            (_reservedTokenIds.current() + 1) <= PERCENTAGE_SCALE,
            "EXCEEDS CAP"
        );
        _mintReserved(_to);
    }

    /*****************
    INTERNAL MINTING FUNCTIONS AND HELPERS
    *****************/
    function _mintSongs(uint256 _packId, address _to) internal {
        uint256 _songCount = 4; // TODO randomize
        for (uint256 _i = 0; _i < _songCount; _i++) {
            _mintItem(_to);
        }
    }

    /// @notice Mint tokens from presale and public pool
    /// @dev Token IDs come from separate pool after reserve
    /// @param _to Recipient of reserved tokens
    function _mintItem(address _to) internal {
        _tokenIds.increment();

        uint256 _id = _tokenIds.current();
        _safeMint(_to, _id);
    }

    /// @notice Mint tokens from reserve
    /// @dev Token IDs come from separate pool at beginning of counter
    /// @param _to Recipient of reserved tokens
    function _mintReserved(address _to) internal {
        _reservedTokenIds.increment();

        uint256 _id = _reservedTokenIds.current();
        _safeMint(_to, _id);
    }

    /*****************
    DISTRIBUTION FUNCTIONS
    *****************/

    /// @notice distributes ETH to supercharged NFT holders
    /// @param accounts Ordered, unique list of supercharged NFT tokenholders
    /// @param distributorAddress Address to receive distributorFee
    function distributeETH(
        address payable[] calldata accounts,
        address distributorAddress
    ) external {
        uint256 numRecipients = accounts.length;
        uint32[] memory percentAllocations = new uint32[](numRecipients);
        for (uint256 i = 0; i < numRecipients; ) {
            // TODO (wm): ideally could access balances directly to save gas
            // for this use case, the require check against the zero address is irrelevant & adds gas
            accounts[i].call{
                value: ((address(this).balance *
                    superchargeBalances[accounts[i]]) / PERCENTAGE_SCALE)
            }("");
            // percentAllocations[i] =
            //     superchargeBalances[accounts[i]] *
            //     PERCENTAGE_SCALE;
            unchecked {
                ++i;
            }
        }

        // atomically deposit funds into split, update recipients to reflect current supercharged NFT holders,
        // and distribute
        // payoutSplit.safeTransferETH(address(this).balance);
        // splitMain.updateAndDistributeETH(
        //     payoutSplit,
        //     accounts,
        //     percentAllocations,
        //     distributorFee,
        //     // TODO (wm): should distributorAddress have a fallback?
        //     // tx.origin or msg.sender if === Address(0)?
        //     distributorAddress
        // );

        // TODO (wm): emit event?
    }

    // TODO balance of supercharged

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
        require(
            _exists(tokenId),
            "ERC721Metadata: URI query for nonexistent token"
        );

        return
            bytes(baseURI).length > 0
                ? string(abi.encodePacked(baseURI, tokenId.toString(), ".json"))
                : "";
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId
    ) internal override(ERC721) {
        super._beforeTokenTransfer(from, to, tokenId);
        if (tokenId <= PERCENTAGE_SCALE) {
            require(to != address(0)); /*Disallow burning of supercharged tokens*/
            if (from != address(0)) {
                superchargeBalances[from]--;
            }
            superchargeBalances[to]++;
        }
    }

    receive() external payable {}
}
