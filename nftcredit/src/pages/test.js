const express = require("express");
const app = express();
// This is a public sample test API key.
// Don’t submit any personally identifiable information in requests made with this key.
// Sign in to see your own test API key embedded in code samples.
const Stripe = require("stripe");
const stripe = Stripe('sk_test_51Mo2Q2DXiInuRLjKj52d3BE07OHgjjB6PLdw9XS6GBv3CScU6J9syL1tDpu5jTvQr1MMcK8fuEE0dsq9VDWStzwc00SFLar0qw:');
const OnrampSessionResource = Stripe.StripeResource.extend({
  create: Stripe.StripeResource.method({
    method: 'POST',
    path: 'crypto/onramp_sessions',
  }),
});


app.use(express.static("public"));
app.use(express.json());

let test = async() => {
    const onrampSession = await new OnrampSessionResource(stripe).create({
        // transaction_details: {
        //   destination_currency: transaction_details["destination_currency"],
        //   destination_exchange_amount: transaction_details["destination_exchange_amount"],
        //   destination_network: transaction_details["destination_network"],
        // },
        customer_ip_address: "147.135.77.241",
      });

    console.log(onrampSession);
}

app.post("/create-onramp-session", async (req, res) => {
  const { transaction_details } = req.body;

//   Create an OnrampSession with the order amount and currency
  const onrampSession = await new OnrampSessionResource(stripe).create({
    transaction_details: {
    //   destination_currency: transaction_details["destination_currency"],
    //   destination_exchange_amount: transaction_details["destination_exchange_amount"],
    //   destination_network: transaction_details["destination_network"],
    },
    customer_ip_address: req.socket.remoteAddress,
  });

// console.log(JSON.stringify(req.socket.remoteAddress))

  res.send(
    "Hello world");
});


// test();

app.listen(4242, () => console.log("Node server listening on port 3000!"));
