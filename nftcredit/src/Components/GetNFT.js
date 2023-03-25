export async function GetNFT({web3AuthProvider, walletAddress}){
        if(web3AuthProvider){
          console.log("Updating Balance");
          console.log(web3AuthProvider)
         let tokenIds = [];
          const provider = new ethers.providers.Web3Provider(web3AuthProvider);
          const signer = await provider.getSigner();
          const nftContract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
    
          let bal = await nftContract.balanceOf(walletAddress);
          bal = bal.toNumber();
          console.log(bal);
          // for(var i=0; i< balance; ++i)
          // {
          //   const tokenId = await nftContract.tokenOfOwnerByIndex( walletAddress, i);
          //   tokenIds.push(tokenId);
          // }
          return bal;
        }
}