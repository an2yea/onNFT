import Head from 'next/head'
import Image from 'next/image'
import Script from 'next/script'

import {
    Slide,
    Grid,
    Card,
    Stack,
    CardActionArea,
    CardMedia,
    CardContent,
    Typography,
    Button
} from '@mui/material'

const listing = [
    {
      name: 'Pikachu',
      image: '/images/pikachu.jpeg',
      price: 'Free'
    },
    {
      name:'Arceus',
      image:'/images/arceus.png',
      price: 'Free'
    },
    {
      name:'Bulbsaur',
      image:'/images/bulbasaur.jpeg',
      price: 'Free'

    }
  ]

  const open = Boolean(true);

  export const Catalogue = () => {
      return  <Stack alignItems='center' spacing={2} width='100%' padding='2rem'>
        <h2> NFTs to Check Out! </h2>
        <Grid container spacing={2} maxHeight='600px' alignItems='center' id="history" overflow='auto' > 
            {listing.map(({name, image, price}) => (
              <Grid key='1' item xs={12} sm={6} md={4} padding='0.5%'>
              <Card sx={{ width:'inherit' ,borderColor:'rgba(253,193,104,1)', borderWidth:'2px', borderStyle:'solid' }}>
                <CardActionArea>
                <CardMedia
                    component="img"
                    height="200"
                    image={image}
                    alt={name}
                  />
                  <CardContent sx={{backgroundColor:'rgba(251,128,128,1)', color:'white'}}>
                    <Typography gutterBottom variant="h5" component="div">
                      {name}
                    </Typography>

                    <Typography variant="body2" color="#1f2833">
                      {price}
                    </Typography>
                    <Button
                    type="submit"
                    variant="contained"
                  sx={{ mt: 2, mb: 2 }} style={{backgroundColor:"#45A29E", color:"white", width:'100%'}} 
                //   onClick={() =>{
                // if(toAddress=="") setToAddress(walletAddress);
                // mintNFT();}}
                > Mint {name} </Button>
                  </CardContent>
                </CardActionArea>
              </Card>
              </ Grid>
            ))}
        </Grid>
        </Stack>
    }