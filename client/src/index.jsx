import React from "react";
import ReactDOM from "react-dom";
import axios from "axios";
import mapboxgl from "mapbox-gl";

import mapboxkey from "../../mapboxkey.js";
import yelpkey from "../../yelpkey.js";
import menu from "../../menudata"

import io from "socket.io-client"
var options = {
  rememberUpgrade:true,
  transports: ['websocket'],
  secure:true, 
  rejectUnauthorized: false
      }

import StarRatings from 'react-star-ratings'

mapboxgl.accessToken = mapboxkey;

class App extends React.Component {
  constructor() {
    super();
    this.state = {
      customer: {
        name: 'John Doe',
        contact: '(123) 456-7890',
        paymentDetails: {
          cardNumber: '12345678910111213141',
          cardExpiry: '05/24'
        }
      },
      lng: -74.00734,
      lat: 40.73304,
      zoom: 14,

      yelpObj: {},
      curRestaurant: {},

      restaurants: [],
      menu: menu,
      displayMenu: false,
      order: [],
      orderTotal: 0,
      orderPending: false,
      status: ''
    };

    this.toggleMenu =  this.toggleMenu.bind(this);
    this.updateOrder = this.updateOrder.bind(this);
    this.updatePrice = this.updatePrice.bind(this);
    this.pendOrder = this.pendOrder.bind(this);

    // this.updateResponse = this.updateResponse.bind(this);

    this.socket = io('http://localhost:2999', options
    // {
    //   withCredentials: true,
    //   extraHeaders: {
    //     "my-custom-header": "abcd"
    //   }

    // }
    );

      

        // const addMessage = data => {
        //     console.log(data);
        //     this.setState({messages: [...this.state.messages, data]});
        //     console.log(this.state.messages);
        // };

        this.sendMessage = () => {

            //ev.preventDefault();
            this.socket.emit('SEND_MESSAGE', {
                customer: this.state.customer,
                order: this.state.order
            })

        }
  }

  // updateResponse(data) {
  //   this.setState({
  //     status: data
  //   })
  // }

  toggleMenu() {
    this.setState((prevState) => ({
      displayMenu: !prevState.displayMenu
    }))
  }
  
  pendOrder() {
    console.log('hi pendorder')
  
    this.setState((prevState) => ({
      orderPending: !prevState.orderPending
    }))
  }

  updateOrder(item) {
    let prevOrder = this.state.order.slice();
    prevOrder.push(item);

    this.setState({
      order: prevOrder
    })
  }

  updatePrice(price) {
    console.log(price);
    this.setState((prevState) => ({
      orderTotal: prevState.orderTotal + price
    }))
  }

  componentDidMount() {
    //this.socket.open();

    this.socket.on('RECEIVE_MESSAGE', function(data){
      console.log('message received', data)
      this.setState({
        status: data.message
      })
    }.bind(this));

    const getRestaurants = `https://api.yelp.com/v3/businesses/search?term=restaurant&latitude=${this.state.lat}&longitude=${this.state.lng}`

    const map = new mapboxgl.Map({
    container: this.mapContainer,
    style: 'mapbox://styles/mapbox/light-v10',
    center: [this.state.lng, this.state.lat],
    zoom: this.state.zoom
    });


    map.on('move', () => {
      this.setState({
      lng: map.getCenter().lng.toFixed(4),
      lat: map.getCenter().lat.toFixed(4),
      zoom: map.getZoom().toFixed(2)
      });

      });

      axios.get('http://localhost:3000/')
      .then((yelpdata) => {
        console.log(yelpdata.data)
        

        const yelpObj = yelpdata.data.reduce((acc, data) => {
          return {...acc,
            [data.name] : {
                'name': data.name,
                'price': data.price, 
                'rating': data.rating, 
                'display_address': data.display_address,
                'display_phone': data.display_phone,
                'categories': data.categories
            }
          }
        }, {})

        this.setState({
          yelpObj: yelpObj
        })

       //console.log('obj', obj)

        var dataset = yelpdata.data.map((x) => (

          {
            'type': 'Feature',
            'properties': {
              
            'icon': 'restaurant',
            'description':
            `<strong>${x.name}</strong>`,
            'name': x.name 
            },
            'geometry': {
            'type': 'Point',
            'coordinates': [x.coordinates.longitude, x.coordinates.latitude]
            }
            }

        ))

        console.log(dataset)

      



      map.on('load',  () => {


        map.loadImage(
        'https://docs.mapbox.com/mapbox-gl-js/assets/custom_marker.png',
        // Add an image to use as a custom marker
        function (error, image) {
        if (error) throw error;
        map.addImage('custom-marker', image);
         
        map.addSource('places', {
        'type': 'geojson',
        'data': {
        'type': 'FeatureCollection',
        'features': dataset
    
        }
        });
         
        // Add a layer showing the places.
        map.addLayer({
        'id': 'places',
        'type': 'symbol',
        'source': 'places',
        'layout': {
        //'icon-image': 'custom-marker',
        'icon-image': '{icon}-15',
        'icon-allow-overlap': true
        }
        });
        }
        );
         
        // Create a popup, but don't add it to the map yet.
        var popup = new mapboxgl.Popup({
        closeButton: false,
        closeOnClick: false
        });
         
        map.on('mouseenter', 'places',  (e) => {
        // Change the cursor style as a UI indicator.
        map.getCanvas().style.cursor = 'pointer';
         
        var coordinates = e.features[0].geometry.coordinates.slice();
        console.log(e, 'e');
        console.log(e.features, 'e.features')
        console.log(e.features[0], 'e features at zero')
        console.log(coordinates, 'coordinates');
        var description = e.features[0].properties.description;
         
        // Ensure that if the map is zoomed out such that multiple
        // copies of the feature are visible, the popup appears
        // over the copy being pointed to.
        //while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
        //coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
        //}
         
        // Populate the popup and set its coordinates
        // based on the feature found.
        popup.setLngLat(coordinates).setHTML(description).addTo(map);
        });
         
        
        map.on('mouseleave', 'places', () => {
        map.getCanvas().style.cursor = '';
        popup.remove();
        });



        map.on('click', 'places',  (e) => {
          // Change the cursor style as a UI indicator.
          console.log(e.features[0].properties.name)
          var name = e.features[0].properties.name
          var restaurantData = this.state.yelpObj[name];
          this.setState({
            curRestaurant: restaurantData
          })

          });

      
        });

      })
      .catch((err) => console.log(err))

    








    }

  render() {
    //console.log(mapboxkey);
    return <div>

            <div style={{display: "inline-block"}}>
              <div className ="mapContainer" ref = {el => this.mapContainer = el} />
            </div>
            <div style={{display: "inline-block"}}>
              <RestaurantContainer curRestaurant = {this.state.curRestaurant}
                                   toggleMenu = {this.toggleMenu}
                                  
                                   />
              {this.state.displayMenu ? <MenuContainer menu = {this.state.menu}
                                                       updateOrder = {this.updateOrder}
                                                       updatePrice = {this.updatePrice}
                                                       /> : null}
              {this.state.displayMenu ? <OrderContainer order = {this.state.order} 
                                                        orderTotal = {this.state.orderTotal}
                                                        sendMessage = {this.sendMessage}
                                                        orderPending = {this.state.orderPending}
                                                        pendOrder = {this.pendOrder}
                                                        status = {this.state.status}
                                                        /> : null}
            </div>
            </div>;
  }
}

let RestaurantContainer = ({curRestaurant, toggleMenu}) => {
console.log('what is propr dot current rest', curRestaurant)
  
if (curRestaurant.name !== undefined) {
return (
    <div className ="restaurantContainer">
      <span style ={{fontSize: '40px', fontWeight: 'bold'}}>
       {curRestaurant.name}
      </span>
      <br/>
    
      <span style ={{fontSize: '20px'}}>
      {' '}{curRestaurant.categories[0].title}{' '}{' '}{curRestaurant.price}
      </span>

      <br/>
      <StarRatings
          rating={curRestaurant.rating}
          starRatedColor="black"
          // changeRating={this.changeRating}
          numberOfStars={5}
          name='rating'
          starDimension = {'15px'}
          starSpacing = {'0px'}
        />
        <br/>
        <br/>
        {curRestaurant.display_phone}
        <br/>
        <div>

          {curRestaurant.display_address.map((x) => (
            <span>
              {x}
              <br/>
            </span>

            ))}

        
        </div>
        
        <br/>
        <span style ={{fontSize: '24px', fontWeight: 'bold'}} onClick = {()=> {toggleMenu()}}>
        Menu
       </span>

      <br/>

     
      
    </div>
  )
} else {
  return (
    <div></div>
  )
}

}

let MenuContainer = ({menu, updateOrder, updatePrice}) => {
  return (
    <div className = "menuContainer">

    {
      menu.map((x) => {
        if (x.type === 'item') {
          return (
            <div onClick = {() => {updateOrder(x.title); updatePrice(Number(x.price))}}>
              <span style = {{fontSize: '16px', fontWeight: 'bold'}}> {x.title} </span> 
              <br/>
              {x.description === null ? null : <span> {x.description} </span>}
              <span style = {{ fontWeight: 'bold'}}> {x.price} </span> <br/>
              <br></br>
            </div>
          )
        } else if (x.type === 'section') {
          return (
            <div>
              <br/>
              <span style = {{fontSize: '24px', fontWeight: 'bold'}}> {x.title} </span> 
              <br/>
              <br/>
            </div>
          )
        }
      })
    }
    </div>
  )
}

let OrderContainer = ({order, orderTotal, sendMessage, orderPending, pendOrder, response, status}) => {

  //if order pending
 if (!orderPending) {
    return (
      <div className = "orderContainer">
          <span style ={{fontSize: '24px', fontWeight: 'bold'}}>
          Your order
        </span>
        <br></br>
        <br></br>
        {order.map((x) => {
          return (
            <span>{x}<br/>
            </span> 
          )
        })}

        {orderTotal === 0 ? <span style ={{fontSize: '16px', fontWeight: 'bold', fontStyle: 'italic'}} >
          Add Items
        </span> :
        <span style ={{fontSize: '16px', fontWeight: 'bold'}} >
        Total: {' '}{orderTotal}
        </span>
          }
        
        <br></br>
        
        
        {orderTotal === 0 ? null :
        <span style ={{fontSize: '24px', fontWeight: 'bold', color: '#4dcf44'}} onClick = {() => {sendMessage(); pendOrder()}}>
          Place Order
        </span>
          }
        
        
        <br></br>

        

      </div>
    )
  } else {
    return (
      <span style ={{fontSize: '30px', fontWeight: 'bold'}} >
            Status: {' '}{status}
          </span>
    )

  }
}

ReactDOM.render(<App />, document.getElementById("app"));