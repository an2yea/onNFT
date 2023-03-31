# asyncNFT

The project builds a flow allowing users to sign-in using web2 Social Accounts or Web3 EOAs, get access to their own smart contract wallets, and be able to buy NFTs or other web3 assets using credit cards. 


<p align="center">
  <img src="public/images/asyncNFT.png" width="250" title="hover text">
</p>

# Features 

1. ### No wallet required for SignUp
    - onNFT helps you access all the capabilities of Web3, directly through your Social Logins using Web3Auth
    - Removes the requirement to create a Metamask Wallet, or remembering 12-word Seed Phrases
    - A Safe wallet is created under the hood, that allows users to initiate and execute transactions


2. ### Buy and Sell directly Through your Credit Cards with Safe On-Ramp Kit
    - The need to understand Cryptocurrencies before buying an NFT is gone now
    - You can simply buy an NFT directly through your Credit Cards, implemented using Safe Onramp Kit
    - The fiat-to-crypto transactions are handled by the Onramp Kit.

3. ### Safe Transactions using Stripe
    - Your credit card transactions are secured by Stripe, making the entire flow seemless

4. ### No Manual Approvals needed
    - While buying NFT's, you will not have to manually sign every transaction
    - With a single click, your NFT will be minted directly to your account

5. ### Gas Fees - Not found
    - No need to understand the concepts of Gas Fees or Approvals on Web3
    - We bear The transaction fees (or the gas fees) of your NFT minting using Gelato's Gasless Transactions

6. ### No Barrier for Entry
    - The website requires no need of an additional application for any functionality
    - Makes it easy to access it from all devices. 


# Extended scope:

- After this POC, the aim is to abstract it into a wrapper, thus providing a AA solution with onramp support, so that dApps can direcly plug it to support SCWs, gasless payments, token-independent gas payments, and credit card payments for web3 asset purchases.
- Further, using a SCW opens up the possibility of developing transaction safeguards, adding access control and building better account recovery to further improve the UX.