import Head from 'next/head'
import Script from 'next/script'
import {ethers} from 'ethers'
import { Contract, providers, utils } from "ethers";
import Backdrop from '@mui/material/Backdrop';
import CircularProgress from '@mui/material/CircularProgress';
import {
  AppBar,
Toolbar,
  IconButton,
  Typography,
  Button,
  Stack,
  Alert,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material'
import SellIcon from '@mui/icons-material/Sell';

import { SafeOnRampKit, SafeOnRampProviderType } from '@safe-global/onramp-kit'

import styles from '@/styles/Home.module.css'
import React, { useEffect, useRef, useState }  from 'react'
// import Web3Modal from "web3modal";

import { GaslessOnboarding} from "@gelatonetwork/gasless-onboarding"
import { CONTRACT_ABI, CONTRACT_ADDRESS } from '../constants/contractdata'
import { GelatoRelay, SponsoredCallRequest } from "@gelatonetwork/relay-sdk";



export default function Home() {

  const [walletAddress, setWalletAddress] = useState();
  const [tokens, setTokens] = useState([]);
  const [gobMethod, setGOBMethod] = useState(null);
  const [gw, setGW] = useState();
  const [loading, setLoading] = useState(false);
  const [toAddress, setToAddress] = useState("");
  const [taskId, setTaskId] = useState("");
  const [taskStatus, setTaskStatus] = useState("");
  const [anchorElement, setAnchorElement] = useState(null);
  const [balanceDialog, setBalanceDialog] = useState(false);

  const open = Boolean(anchorElement)
  const handleClick = (e) => {
    setAnchorElement(e.currentTarget);
  }

  const handleClose = () => {
    setAnchorElement(null);
  }
  const handleClickLogout = () => {
    setAnchorElement(false);
    logout();
  }

  const initOnramp = async () => {
    const safeOnRamp = await SafeOnRampKit.init(SafeOnRampProviderType.Stripe, {
      onRampProviderConfig: {
        stripePublicKey:
          'pk_test_51MZbmZKSn9ArdBimSyl5i8DqfcnlhyhJHD8bF2wKrGkpvNWyPvBAYtE211oHda0X3Ea1n4e9J9nh2JkpC7Sxm5a200Ug9ijfoO', // Safe public key
        onRampBackendUrl: 'https://aa-stripe.safe.global', // Safe deployed server
      },
    });

    const sessionData = await safeOnRamp.open({
      walletAddress: walletAddress,
      networks: ['ethereum', 'polygon'],
      element: '#stripe-root',
      // sessionId: 'cos_1Mei3cKSn9ArdBimJhkCt1XC', // Optional, if you want to use a specific created session
      events: {
        onLoaded: () => console.log('Loaded'),
        onPaymentSuccessful: () => console.log('Payment successful'),
        onPaymentError: () => console.log('Payment failed'),
        onPaymentProcessing: () => console.log('Payment processing')
      }
    })

    console.log(sessionData);

  }
  

  const login = async() => {
    try{
      setLoading(true);
      const gaslessWalletConfig = { apiKey: process.env.NEXT_PUBLIC_GASLESSWALLET_KEY};
      const loginConfig = {
        domains: ["http://localhost:3000/"],
        chain : {
          id: 80001,
          rpcUrl: "https://wiser-alien-morning.matic-testnet.discover.quiknode.pro/c2f6cfc05517853e094ad7ea47188326625f20b5/",
        },
        openLogin: {
          redirectUrl: `http://localhost:3000/`,
        },
      };
      const gaslessOnboarding = new GaslessOnboarding(
        loginConfig,
        gaslessWalletConfig
      );
      
      await gaslessOnboarding.init();
      const web3AuthProvider = await gaslessOnboarding.login();
      setLoading(false);
      console.log("Web3 Auth Provider", web3AuthProvider);
      setGOBMethod(gaslessOnboarding);

      const gaslessWallet = gaslessOnboarding.getGaslessWallet();
      setGW(gaslessWallet);
      console.log("Wallet is", gaslessWallet)

      const address = gaslessWallet.getAddress();
      setWalletAddress(address);

      const result = await fetch(`https://api.covalenthq.com/v1/80001/address/${address}/balances_v2/?key=${process.env.NEXT_PUBLIC_COVALENT_APIKEY}`);
      const balance = await result.json();
      setTokens(balance.data.items);

    } catch (err){
      console.error(err);
    }
  }

  const renderAlert = () => {
    console.log("TaskStatus is", taskStatus);
    // console.log("here in renderAlert")
    switch(taskStatus){
      case 'Initialised':
        return <Alert severity='info'> Request created</Alert>
      case 'CheckPending':
        return <Alert severity='info'> The Request is being processed (check pending)</Alert>
      case 'ExecPending':
        return <Alert severity='info'> The Request is being processed (execution pending) </Alert>
      case 'WaitingForConfirmation':
        return <Alert severity='info'> The Request is being processed (waiting for confirmation)</Alert>
      case 'ExecSuccess':
        return <Alert severity='success'> The Request was successful </Alert>
      case 'Cancelled':
        return <Alert severity='error'> The Request was Cancelled </Alert>
      case 'ExecReverted':
        return <Alert severity='warning'> The request was Reverted </Alert>
      // default: return <Alert severity='info'> WAITTTTT</Alert>

    }
  }
  useEffect(() => {

    if(taskId){

       let call = setInterval(() => 
    {
        console.log("Task Id is", taskId);
        try{
          fetch(`https://relay.gelato.digital/tasks/status/${taskId}`)
        .then(response => response.json())
        .then(task => {
          
          if(task.task != undefined){
            setTaskStatus(task.task.taskState)
            console.log("Task status inside interval is", task.task.taskStatus);
            console.log("State access inside useeffect", taskStatus)
            if(task.task.taskState == 'Cancelled' || task.task.taskState == 'ExecSuccess')clearInterval(call)
          }
        });
        }
        catch(err){
          
          setTaskStatus('Initialised')
        }
        
    }, 1500);
    }
  }, [taskId])

  // var possTaskStatus= ["CheckPending", "ExecPeding", "WaitingForConfirmation", "ExecSuccess", "Cancelled","ExecReverted"];
  // useEffect(() => {
  //   setInterval(() => 
  //   {
  //       setTaskStatus("CheckPending");
  //   }, 1000);
  // }, []);

  useEffect(() => {
    console.log('Task status was changed', taskStatus);
    renderAlert();
  }, [taskStatus]);

  

  const mintNFT = async() => {
    try{
      setLoading(true);
      const relay = new GelatoRelay();
      let iface = new ethers.utils.Interface(CONTRACT_ABI);
      let tokenURI = "ipfs://bafyreidrt5utdvnwonctnojcese7n2lzi4pkcvvtz7mw2ptijbtnb5sfya/metadata.json"
      let recipient = toAddress;
      console.log(recipient, tokenURI);
      
      let tx = iface.encodeFunctionData("mintNFT", [ recipient, tokenURI ])
      
      console.log(tx)
      console.log(gw);
      const temp = await gw.sponsorTransaction(
        CONTRACT_ADDRESS,
        tx,
        ethers.utils.parseEther("0.001")
      );
      console.log(temp)

      // //TODO: render TASK Id afer fetching -> the status of the request
      setTaskId(temp.taskId, console.log(taskId));
      setLoading(false);
      //setTaskId("0x8126409bfcae6dc2513e9fd1cfd285b8e7f509c248d0b22666c8f27b38e89922");
      return <> Task Id : {taskId}</>
      
    } catch (error) {
      console.log(error)
    }
  }
  
  const logout = async() =>{
    setLoading(true);
    await gobMethod.logout();
    setWalletAddress();
    setLoading(false);
  }

  const renderButton = () => {
    if(!walletAddress){
      return <Button color="inherit" onClick={login}> Login </Button>
    }
    else{
        console.log("logged in", walletAddress);
        return <Button color="inherit" id="account-button" onClick={handleClick} aria-controls="open ? 'account-menu' : undefined" aria-haspopup="true" aria-expanded={open ? 'true':undefined}> {walletAddress}</Button>} 
  }

  const renderForm = () => {
    if(walletAddress) {
      return <>
      <form>
          {/* <label> URL </label>  */}
          {/* <input value={url} onChange={(e) => setURL(e.target.value)} /> <br></br> */}
          <label> toAddress </label>
          <input value={toAddress} onChange={(e) => setToAddress(e.target.value)} />
        </form>
        <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }} onClick={mintNFT}> Mint NFT</Button></>
    }
  }
  const renderTask = () => {
    if(walletAddress && taskId){
      return <> Task Id: {taskId}</>
    }
  }

  return (
    <>
      <Head>
        <title> NFT Credit </title>
        <meta name="description" content="Generated by create next app" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <AppBar position="sticky">
        <Toolbar variant="regular">
          <IconButton size='large' edge='start' color='inherit' aria-label='logo'>
            <SellIcon />
          </IconButton> 
          <Typography variant='h6' component='div' sx={{ flexGrow: 1 }}>
          onNFT
        </Typography>
        <Stack direction='row' spacing={2}>
          {renderButton()}
        </Stack>
        <Menu id="account-menu" anchorEl={anchorElement} open={open} MenuListProps ={{'aria-labelledby' : 'account-button,'}} onClose ={handleClose} >
          <MenuItem onClick={handleClickLogout}> Log Out </MenuItem>
          <MenuItem onClick={() => setBalanceDialog(true)}> Check Balance </MenuItem>
        </Menu>
        <Dialog open= {balanceDialog} onClose = {() => setBalanceDialog(false)}aria-labelledby='dialog-title' aria-describedby='dialog-desc'>
      <DialogTitle id='dialog-title'> Current Balance </DialogTitle>
      <DialogContent>
        <DialogContentText id='dialog-desc'> {tokens.map(token => (
          <div key={token.contract_name}>
            <img src={token.logo_url} alt="token" />
            <p>{token.balance / (10 ** token.contract_decimals)} {token.contract_ticker_symbol}</p>
          </div>
        ))} </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => {
          setBalanceDialog(false), logout
        }}> LogOut</Button>
        <Button onClick={() => setBalanceDialog(false)}> Close </Button>
      </DialogActions>
    </Dialog>  
        </Toolbar>
      </AppBar>
      <main className={styles.main}> 
        <h1> NFT Credit using Gasless Wallet</h1>
        <div id='stripe-root'></div>
        {walletAddress && <p>{walletAddress}</p>}        

        {renderForm()}
        {renderTask()}
        {renderAlert()}
       
        <Backdrop
        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={loading}>
        <CircularProgress color="inherit" /></Backdrop>
      </main>
    
    </>
  )
}



  // ----------------  GELATO relay

    
  // const mintRelay = async() => {
  //   const relay = new GelatoRelay();  

  //   let tokenURI = "ipfs://bafyreidrt5utdvnwonctnojcese7n2lzi4pkcvvtz7mw2ptijbtnb5sfya/metadata.json"
  //   let recipient = toAddress;


  //   // Populate a relay request
  //     const request = {
  //     chainId: provider.network.chainId,
  //     target: counter,
  //     data: data,
  //     };

  //   // Without a specific API key, the relay request will fail! 
  //   // Go to https://relay.gelato.network to get a testnet API key with 1Balance.
  //   // Send the relay request using Gelato Relay!
  //   const relayResponse = await relay.sponsoredCall(request, apiKey);
  // }
    
  //

  // //
  // const [walletConnected, setWalletConnected] = useState(false);
  // const web3ModalRef = useRef();
  // // ------------------

  // const mintTest = async() =>{
  //   try{
  //     const signer = await getProviderOrSigner(true);

  //     const nftContract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

  //     const tx = await nftContract.mintNFT(toAddress, "ipfs://bafyreidrt5utdvnwonctnojcese7n2lzi4pkcvvtz7mw2ptijbtnb5sfya/metadata.json");
  //     // setLoading(true);
  //     await tx.wait();
  //     // setLoading(false);
  //     window.alert("You have successfully minted a test NFT!")
  //   }

  //   catch(err){
  //     console.log(err);
  //   }
  // }

  // const connectWallet = async () => {
  //   try {
  //     // Get the provider from web3Modal, which in our case is MetaMask
  //     // When used for the first time, it prompts the user to connect their wallet
  //     await getProviderOrSigner();
  //     setWalletConnected(true);
  //   } catch (err) {
  //     console.error(err);
  //   }
  // };

  // const getProviderOrSigner = async (needSigner = false) => {
  //   // Connect to Metamask
  //   // Since we store `web3Modal` as a reference, we need to access the `current` value to get access to the underlying object
  //   const provider = await web3ModalRef.current.connect();
  //   const web3Provider = new providers.Web3Provider(provider);

  //   // If user is not connected to the Goerli network, let them know and throw an error
  //   const { chainId } = await web3Provider.getNetwork();
  //   if (chainId !== 5) {
  //     window.alert("Change the network to Goerli");
  //     throw new Error("Change network to Goerli");
  //   }

  //   if (needSigner) {
  //     const signer = web3Provider.getSigner();
  //     return signer;
  //   }
  //   return web3Provider;
  // };

  // // useEffect(() => {
  // //   // if wallet is not connected, create a new instance of Web3Modal and connect the MetaMask wallet
  // //   if (!walletConnected) {
  // //     // Assign the Web3Modal class to the reference object by setting it's `current` value
  // //     // The `current` value is persisted throughout as long as this page is open
  // //     web3ModalRef.current = new Web3Modal({
  // //       network: "PolygonMumbai",
  // //       providerOptions: {},
  // //       disableInjectedProvider: false,
  // //     });
  // //     connectWallet();
  // //   }
  // // }, [walletConnected]);

  // // -------------------
  
  // ---------------> Gelato Relay
     // let val = {value: ethers.utils.parseEther("0.001")}
      // const provider = new ethers.providers.Web3Provider(window.ethereum);
      // const signer = provider.getSigner();

      // const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      // const { data } = await contract.populateTransaction.mintNFT(recipient, tokenURI);

      // const request= {
      //   chainId: 5,
      //   target: toAddress,
      //   data: tx,
      //   user: walletAddress
      // }

      // const relayresponse = await relay.sponsoredCall(request, process.env.NEXT_PUBLIC_GASLESSWALLET_KEY)
      // const taskId = relayresponse.taskId;