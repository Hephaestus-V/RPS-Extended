# RPS-Extended

## Overview

This project implements a decentralized web3 application for playing the
extended version of Rock Paper Scissors (RPS) with additional weapons
(Lizard and Spock). The game follows the rules described in the
[Wikipedia
article](https://en.wikipedia.org/wiki/Rock_paper_scissors#Additional_weapons).
The application is designed to allow two parties to play securely, with
ETH stakes, on an Ethereum testnet.


## Game Creation

Player 1 initiates a game by performing the following actions:

- **Committing to a move** : Player 1 selects their move and hashes it
    using a unique salt value for security. The hash is submitted to the
    smart contract, ensuring Player 2 cannot determine Player 1\'s
    choice before the reveal phase.

-  **Selecting Player 2**: Player 1 specifies the address of Player 2,
    who is invited to join the game.

-  **Staking ETH**: Player 1 stakes a predefined amount of ETH, which
    serves as the wager for the game.

## Game Joining

Player 2 joins the game by:

-  **Matching the ETH stake** : Player 2 stakes an equivalent amount of
    ETH to match Player 1\'s wager.

- **Choosing their move**: Player 2 selects their move and submits it
    directly to the smart contract.

## Move Revelation

Once Player 2 has made their move:

-  **Player 1 reveals their move**: Player 1 submits the original move
    and the associated salt value to the smart contract.

-  **Contract determines the winner** : The contract verifies Player
    1\'s move by re-hashing it with the salt and comparing it to the
    initial commitment. Based on the moves of both players, the contract
    determines the winner and distributes the ETH stakes accordingly.

-  **Handling ties** : In the case of a tie, the ETH stakes are split
    evenly between the players.

## Timeout Handling

Timeouts ensure fairness in case one player becomes unresponsive:

-   If Player 2 fails to join the game within the timeout period, Player
    1 can reclaim their staked ETH.

-   If Player 1 fails to reveal their move within the timeout period
    after Player 2 has made their move, Player 2 can claim the entire
    stake.



## Additional Details

-   **User Experience** :

    -   The interface is minimalistic but functional, ensuring usability
        without unnecessary distractions.

    -   Players can easily create and join games using simple prompts
        and clear instructions.

-  **Platform Compatibility**:

    -   The application is optimized for browsers with Metamask
        installed and tested on Ethereum Sepolia testnet.

