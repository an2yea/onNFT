import Head from 'next/head'
import Script from 'next/script'
import {ethers} from 'ethers'
import { Contract, providers, utils } from "ethers";
import Backdrop from '@mui/material/Backdrop';
import CircularProgress from '@mui/material/CircularProgress';
import { borderColor, createTheme } from '@mui/system';

import { CardActionArea } from '@mui/material';

import {
  AppBar,
Toolbar,
Box,
  IconButton,
  Grid,
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
  CardContent,
  CardMedia,
  TextField,
  Slide
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
  const [mynfts, setMynfts] = useState([]);
  const [gobMethod, setGOBMethod] = useState(null);
  const [gw, setGW] = useState();
  const [loading, setLoading] = useState(false);
  const [toAddress, setToAddress] = useState("");
  const [taskId, setTaskId] = useState("");
  const [taskStatus, setTaskStatus] = useState("");
  const [anchorElement, setAnchorElement] = useState(null);
  const [web3AuthProvider, setWeb3AuthProvider] = useState(null)
  const [balanceDialog, setBalanceDialog] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
 

  const open = Boolean(anchorElement)
  const handleClick = (e) => {
    setAnchorElement(e.currentTarget);
  }

  const handleClose = () => {
    setAnchorElement(null);
  }
  const handleClickLogout = () => {
    setAnchorElement(false);
    setShowHistory(false);
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
  
    const fetchUsers = async() => {
      try{
      if(web3AuthProvider != undefined){
        const tokens = [];
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
          const tokenURI = await nftContract.tokenURI(tokenId);
          const metadata = await fetch(`https://ipfs.io/ipfs/${tokenURI.substr(7)}`).then(response => response.json());
          tokens.push({tokenId, tokenURI, metadata});
        }
        console.log("Hello ji",tokens);
        setMynfts(tokens);
      }
    }catch(err){
      console.log(err);
    }
    }

  
  useEffect(()=>{
    login();
  }, [])

  useEffect(() =>{
    console.log("Web3auth changed");
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
    if(walletAddress){
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
    }
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
            if(task.task.taskState == 'Cancelled' || task.task.taskState == 'ExecSuccess'){
              clearInterval(call);
              fetchUsers();
            }
          }
        });
        }
        catch(err){
          
          setTaskStatus('Initialised')
        }
        
    }, 1500);
    }
  }, [taskId])

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
    setMynfts([]);
  }

  const renderButton = () => {
    if(!walletAddress){
      return <Button style={{backgroundColor:"#45A29E", color:"white"}}variant="contained" color="inherit" size="medium" onClick={login}> Login </Button>
    }
    else{
        console.log("logged in", walletAddress);
        return <Button style={{backgroundColor:"#45A29E", color:"white"}} variant="contained" color="inherit" id="account-button" size="medium" onClick={handleClick} aria-controls="open ? 'account-menu' : undefined" aria-haspopup="true" aria-expanded={open ? 'true':undefined}> {walletAddress}</Button>} 
  }

  const renderForm = () => {
    if(walletAddress) {
      return <Stack alignItems='center'>
          <TextField required sx={{mt:2, mb:2}} width="100%" label="Address to Mint NFT" variant="outlined" name="toAddress" value={toAddress} onChange={(e) => setToAddress(e.target.value)}> </TextField>
        <Button
              type="submit"
              variant="contained"
              sx={{ mt: 2, mb: 2 }} style={{backgroundColor:"#45A29E", color:"white", width:'100%'}} onClick={mintNFT}> Mint NFT</Button></Stack>
    }
  }

  const renderHistory = () => {
    if(!showHistory){
      return <Slide direction="up" in={!showHistory} out={showHistory} mountOnEnter unmountOnExit><Grid item xs={12} md={6}>
        <Card sx={{mt:2, mb:4, flexDirection:'col'}} position="fixed" styles={{Color:"black"}}>
        <Stack spacing={4} alignItems='center' width='100%' padding='4rem'> 
        <h1 styles={{fontFamily:'sans-serif', justifyContent:'center'}}> NFT Credit with Gasless Wallet</h1>
        {renderForm()}
        {renderAlert()}
        </Stack>
        <Backdrop
        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={loading}>
        <CircularProgress color="inherit" /></Backdrop>
        </ Card>
        </Grid>
        </Slide>
    }
  }

  return (
    <div>
      <Head>
        <title> NFT Credit </title>
        <meta name="description" content="Generated by create next app" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/logo.svg" />
      </Head>
      <Box sx={{mt:3, flexDirection: 'row', justifyContent:'center', alignItems:'center'}}>
      <AppBar  position="sticky" style={{backgroundColor:"transparent"}}>
        <Toolbar sx={{ml:'2%'}}variant="regular" >
          <img src='images/logo.svg' height='70px' width='50px'/>
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
          {showHistory && <MenuItem onClick={() => setShowHistory(false)}> Mint New NFT </MenuItem>}
          {!showHistory && <MenuItem onClick={() => setShowHistory(true)}> Show My NFTs</MenuItem>}
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
      
      <Grid container flexDirection='column' alignItems='center' spacing={4} paddingLeft='2%' paddingRight='2%' >
      {renderHistory()}
      <Slide direction="up" in={showHistory} out={!showHistory} mountOnEnter unmountOnExit><Grid item xs={12} md={8} width="100%" maxHeight="600px" alignItems='center' justifyItems='center'>
      <Card sx={{mt:2, mb:4, flexDirection:'col', alignItems:'center', justifyItems:'center'}} position="fixed" styles={{Color:"black"}} padding='4%' paddingTop='4%' margin='4%'>
      <Stack alignItems='center' spacing={4} padding='4%' >
        <h1> My NFTs</h1>
        <Typography variant="h3"> {mynfts.length} NFT's in your collection</Typography>
        {!mynfts.length && <h3 color='#45A29E'> Generate and mint your NFT to see them here</h3>}
        <Grid container spacing={6} maxHeight='600px' alignItems='center' id="history" overflow='auto' > 
            {mynfts.map(nft => (
              <Grid item xs={12} sm={6} padding='1%'>
              <Card sx={{ width:'inherit' ,borderColor:'#5D5DFF', borderWidth:'2px', borderStyle:'solid' }}>
                <CardActionArea>
                <CardMedia
                    component="img"
                    height="200"
                    image="next.svg"
                    alt="green iguana"
                  />
                  <CardContent sx={{backgroundColor:'#45A29E', color:'white'}}>
                    <Typography gutterBottom variant="h5" component="div">
                      {nft.metadata.name}
                    </Typography>
                    <Typography variant="body2" color="#1f2833">
                      Here is your NFT on the beach!
                    </Typography>
                  </CardContent>
                </CardActionArea>
              </Card>
              </ Grid>
            ))}
        </Grid>
        </Stack>
        </Card>
        </Grid></Slide >
      
      <Backdrop
        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={loading}>
        <CircularProgress color="inherit" /></Backdrop>
      </Grid >
    {/* </Card> */}
    
      
    </Box>
    </div>
  )
}

