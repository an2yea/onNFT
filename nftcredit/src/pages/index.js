import Head from 'next/head'
import Script from 'next/script'
import {ethers} from 'ethers'
import { Contract, providers, utils } from "ethers";
import Backdrop from '@mui/material/Backdrop';
import CircularProgress from '@mui/material/CircularProgress';
import { createTheme } from '@mui/system';

import {
  AppBar,
Toolbar,
Box,
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
  Card,
  TextField,
} from '@mui/material'

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
  const [web3AuthProvider, setWeb3AuthProvider] = useState(null)
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
    }
      
    );

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
  // function copyTextToClipboard(text) {
  //   if (!navigator.clipboard) {
  //     fallbackCopyTextToClipboard(text);
  //     return;
  //   }
  //   navigator.clipboard.writeText(text).then(function() {
  //     console.log('Async: Copying to clipboard was successful!');
  //   }, function(err) {
  //     console.error('Async: Could not copy text: ', err);
  //   });
  // }
  const copyTextToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(text);
      console.log('Content copied to clipboard');
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  }
  

    const fetchUsers = async() => {
      try{
      if(web3AuthProvider != undefined){
        const tokenIds = [];
        const provider = new ethers.providers.Web3Provider(web3AuthProvider);
        console.log(provider);
        const signer = await provider.getSigner();
        console.log(CONTRACT_ABI);
        console.log(CONTRACT_ADDRESS)
        console.log(signer)
        const nftContract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

        let bal = await nftContract.balanceOf(walletAddress);
        console.log('Balance is', bal.toNumber());

        for(var i=0; i<bal;++i){
          const tokenId = await nftContract.tokenOfOwnerByIndex(walletAddress, i);
          tokenIds.push(tokenId);
        }
        console.log(tokenIds);
      }
    }catch(err){
      console.log(err);
    }
    }

  
  useEffect(()=>{
    login();
  }, [])

  useEffect(() =>{
    console.log("Web3auth changed")
    fetchUsers();
  }, [web3AuthProvider])

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
      const web3AP = await gaslessOnboarding.login();
      setWeb3AuthProvider(web3AP);
      setLoading(false);
      console.log("Web3 Auth Provider", web3AP);
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
      console.log("in mint")
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
      return <Button style={{backgroundColor:"#5D5DFF", color:"white"}}variant="contained" color="inherit" size="medium" onClick={login}> Login </Button>
    }
    else{
        console.log("logged in", walletAddress);
        return <Button style={{backgroundColor:"#5D5DFF", color:"white"}} variant="contained" color="inherit" id="account-button" size="medium" onClick={handleClick} aria-controls="open ? 'account-menu' : undefined" aria-haspopup="true" aria-expanded={open ? 'true':undefined}> {walletAddress}</Button>} 
  }

  const renderForm = () => {
    if(walletAddress) {
      return <>
          {/* <label> URL </label>  */}
          {/* <input value={url} onChange={(e) => setURL(e.target.value)} /> <br></br> */}
          <TextField required sx={{mt:2, mb:2}} width="100%" label="Address to Mint NFT" variant="outlined" name="toAddress" value={toAddress} onChange={(e) => setToAddress(e.target.value)}> </TextField>
        <Button
              type="submit"
              variant="contained"
              sx={{ mt: 2, mb: 2 }} style={{backgroundColor:"#5D5DFF", color:"white", width:'100%'}} onClick={mintNFT}> Mint NFT</Button></>
    }
  }

  return (
    <div>
      <Head>
        <title> NFT Credit </title>
        <meta name="description" content="Generated by create next app" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Box sx={{mt:3, flexDirection: 'row', justifyContent:'center', alignItems:'center'}}>
      <AppBar  position="sticky" style={{backgroundColor:"transparent"}}>
        <Toolbar sx={{ml:'2%'}}variant="regular" >
          <img src='images/logo5.svg' height='70px' width='50px'/>
          <Typography variant='h6' component='div' sx={{ flexGrow: 1 }}>
            &nbsp; onNFT
        </Typography>
        <Stack direction='row' spacing={2}>
          {renderButton()}
        </Stack>
        <Menu id="account-menu" anchorEl={anchorElement} open={open} MenuListProps ={{'aria-labelledby' : 'account-button,'}} onClose ={handleClose} >
          <MenuItem onClick={handleClickLogout}> Log Out </MenuItem>
          <MenuItem onClick={() => setBalanceDialog(true)}> Check Balance </MenuItem>
          <MenuItem onClick={() => navigator.clipboard.writeText(`${walletAddress}`)}> Copy wallet Address</MenuItem>
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
      <Card sx={{maxWidth:600,maxHeight:600, mt:2, mb:4, flexDirection:'col', marginLeft:'30%', width:'auto'}} position="fixed" styles={{Color:"black"}}>
      <Stack alignItems='center'>
      <main styles={{padding:'4rem', width:'100%'}} className={styles.main} > 
        <Stack spacing={4} alignItems='center' width='100%'> 
        <h1 styles={{fontFamily:'sans-serif', justifyContent:'center'}}> NFT Credit with Gasless Wallet</h1>
        {renderForm()}
        {renderAlert()}
        </Stack>
        <Backdrop
        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={loading}>
        <CircularProgress color="inherit" /></Backdrop>
      </main>
      </Stack>
    </Card>
      
    </Box>
    </div>
  )
}

