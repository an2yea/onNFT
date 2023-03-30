# onNFT

The project builds a flow or experience, which lets users sign-in using web2 social accounts or web3 EOAs, get access to their own smart contract wallets, and be able to buy NFTs or other web3 assets using credit cards. 

# Why this Project

For users to safely and acively ride the NFT bandwagon, it's necessary to narrow down the jump from moving from Web2 and Web3 become smaller than what it is currently. We enable this by including:-

- Ability to login using web2 socials or web3 EOAs
- Deployment of a **SCW**(Smart Contract Wallet) for the user, and mapping the deployed address to this user(deterministic deployment)
- **Relaying support** to provide the ability to pay gas for transactions using balance in the SCW, regardless of it not being in the native block-chain token (cross-chain gas payment)
- An **onramp** solution for fraud-safe fiat-to-crypto conversions.
- An NFT contract to mint NFTs and verify the complete flow.

**Extended scope:**

- After this POC, the aim is to abstract it into a wrapper, thus providing a AA solution with onramp support, so that dApps can direcly plug it to support SCWs, gasless payments, token-independent gas payments, and credit card payments for web3 asset purchases.
- Further, using a SCW opens up the possibility of developing transaction safeguards, adding access control and building better account recovery to further improve the UX.