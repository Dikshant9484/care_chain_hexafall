// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title CareToken – Soul-bound “Proof-of-Care” NFT + Message Log
/// @notice Submitting a care message mints a non-transferable badge to the sender
/// @dev Compatible with OpenZeppelin 4.9.x (uses _beforeTokenTransfer hook)

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract CareToken is ERC721, Ownable {
    /* ---------------------------------------------------------------------- */
    /*  Storage                                                               */
    /* ---------------------------------------------------------------------- */

    uint256 private _tokenIds;

    /// tokenId → message (public for easy demo)
    mapping(uint256 => string) public tokenMessage;

    /// user → list of message indices (so front-end can show history)
    mapping(address => uint256[]) public userTokens;

    /* ---------------------------------------------------------------------- */
    /*  Constructor                                                           */
    /* ---------------------------------------------------------------------- */

    constructor() ERC721("Care Token", "CARE") {}

    /* ---------------------------------------------------------------------- */
    /*  Main entry: submitCare                                                */
    /* ---------------------------------------------------------------------- */

    /// @notice Submit a proof-of-care message and receive a soul-bound NFT
    /// @param message  Short thank-you note (≤ 140 chars suggested)
    function submitCare(string calldata message) external {
        require(bytes(message).length > 0, "Message required");

        _tokenIds += 1;
        uint256 newId = _tokenIds;

        _safeMint(msg.sender, newId);        // mint to sender
        tokenMessage[newId] = message;
        userTokens[msg.sender].push(newId);
    }

    /* ---------------------------------------------------------------------- */
    /*  View helpers                                                          */
    /* ---------------------------------------------------------------------- */

    function getMyMessages() external view returns (string[] memory) {
        uint256[] storage ids = userTokens[msg.sender];
        string[] memory msgs = new string[](ids.length);
        for (uint256 i = 0; i < ids.length; ++i) {
            msgs[i] = tokenMessage[ids[i]];
        }
        return msgs;
    }

    /* ---------------------------------------------------------------------- */
    /*  Soul-bound enforcement                                                */
    /* ---------------------------------------------------------------------- */

    /// @dev Block transfers after mint; allow mint (from == 0) and burn (to == 0)
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId,
        uint256 batchSize
    ) internal override {
        if (from != address(0) && to != address(0)) {
            revert("Soulbound: transfer forbidden");
        }
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
    }

    /* ---------------------------------------------------------------------- */
    /*  Optional burn (receiver freedom)                                      */
    /* ---------------------------------------------------------------------- */

    function burn(uint256 tokenId) external {
        require(ownerOf(tokenId) == msg.sender, "Not token owner");
        _burn(tokenId);
        delete tokenMessage[tokenId];
        // remove from userTokens array (gas-optimised naïve remove)
        uint256[] storage arr = userTokens[msg.sender];
        for (uint256 i = 0; i < arr.length; ++i) {
            if (arr[i] == tokenId) {
                arr[i] = arr[arr.length - 1];
                arr.pop();
                break;
            }
        }
    }
}
