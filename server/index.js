const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');
const cors = require("cors");
const axios = require('axios');

const port = process.env.PORT ||3000;

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(cookieParser());
//app.use(express.static(__dirname + "/../client/dist"));

app.get("/", (req, res) => {
  //res.status(200).json("Server is working!");
  //res.cookie('CookieKey', 'MattPutThishere');
  //res.json("Hi")

  var config = {
    method: 'get',
    url: 'https://api.yelp.com/v3/businesses/search?term=restaurant&location=10014',
    headers: { 
      'Authorization': 'Bearer iBnihufGoeVl4-omhlc-mG6_1-D_ytkW8pDOXKdgbJbr7BePAY0bxQEBHTTuUTjEtM1Ahx8eWFrdMa2mT6JAecdukaZkPXjoeQwgS0Ep5tINxpKgrG0vvcA2meXXX3Yx',
      'Access-Control-Allow-Origin': '*',
    }
  };
  
  axios(config)
  .then(function (response) {
    //console.log(JSON.stringify(response.data));
    var result = response.data['businesses'].map((x) => (
      {id: x.id,
        name: x.name,
        //location: x.location,
        coordinates: x.coordinates,

        price: x.price,
        rating: x.rating,
        display_address: x.location.display_address,
        display_phone: x.display_phone,
        categories: x.categories

      }
    ))
    res.send(result);
    console.log(result);
  })
  .catch(function (error) {
    console.log('whats the error', error);
  });
  
});

app.listen(port, () => {
  console.log(`App is running at http://localhost:${port}`);
});
