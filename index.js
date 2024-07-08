const express = require('express');
const cors = require('cors');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cookieParser = require('cookie-parser');
const app = express();
const port = process.env.PORT || 5000;
// const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || 'sk_test_51OMCncJNucR5rk9lcKrEYph53hR2ke2jAt8BuN7BnvpKv2MTU0cqZ957ofkemofDZTkdHS8nIKeLc214qKwXH5B20080a2YfA1');


//middleware
// app.use(cors({
//   origin: [
//     'https://tastebud-tavern.web.app',
//     'https://tastebud-tavern.firebaseapp.com',
//     'http://localhost:5173'
//   ],
//   credentials: true
// }));
app.use(cors());
app.use(express.json());
app.use(cookieParser());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.bnzewy6.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

//my middlewares 
// const logger = (req, res, next) => {
//   console.log('loginfo : ', req.method, req.url);
//   next();
// }

// const verifyToken = (req, res, next) => {
//   const token = req?.cookies?.token;
//   // console.log('token in the middleware', token);
//   // next();
//   if (!token) {
//     return res.status(401).send({ message: 'unauthorized access' })
//   }
// //   jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
// //     if (err) {
// //       return res.status(401).send({ message: 'unauthorized access' })
// //     }
// //     req.user = decoded;
// //     next();
// //   })
// // }

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    //await client.connect();

    const userCollection = client.db('curehub').collection('users');
    const medicineCollection = client.db('curehub').collection('medicines');
    const adsCollection = client.db('curehub').collection('ads');
    const categoryCollection = client.db('curehub').collection('category');
    const cartCollection = client.db('curehub').collection('cart');
    const queriesCollection = client.db('curehub').collection('queries');
    const appoinmentCollection = client.db('curehub').collection('appoinment');
    const doctorsCollection = client.db('curehub').collection('doctor');
    const telemedicineCollection = client.db('curehub').collection('telemedicine');


    // stripe
//     app.post('/create-payment-intent', async (req, res) => {
//   const { amount } = req.body;

//   try {
//     const paymentIntent = await stripe.paymentIntents.create({
//       amount,
//       currency: 'usd',
//     });

//     res.send({
//       clientSecret: paymentIntent.client_secret,
//     });
//   } catch (error) {
//     res.status(500).send({ error: error.message });
//   }
// });
    
    // user related api 
    app.get('/users', async (req, res) => {
      const users = await userCollection.find().toArray();
      res.send(users);
    })

    app.post('/users', async (req, res) => {
      const user = req.body;
      console.log(user);
      const result = await userCollection.insertOne(user);
      res.send(result);
    })


    //medicine related API
    app.get('/medicine', async (req, res) => {
      console.log(req.body);
      console.log('owener info: ', req.user);
      //console.log('cookkkkkiee', req.cookies);
      const medicine = medicineCollection.find();
      const result = await medicine.toArray();
      res.send(result);
    })

    app.post('/medicine', async (req, res) => {
      const medicine = req.body;
      console.log(medicine);
      const result = await medicineCollection.insertOne(medicine);
      res.send(result);
    })

    app.delete('/medicine/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await medicineCollection.deleteOne(query);
      res.send(result);
    })


    //  Advertisement 
    app.get('/ads', async (req, res) => {
      console.log(req.body);
      console.log('owener info: ', req.user);
      //console.log('cookkkkkiee', req.cookies);
      const ads = adsCollection.find();
      const result = await ads.toArray();
      res.send(result);
    })

    app.post('/ads', async (req, res) => {
      const ads = req.body;
      console.log(ads);
      const result = await adsCollection.insertOne(ads);
      res.send(result);
    })

    // category 

    app.get('/category', async (req, res) => {
      console.log(req.body);
      console.log('owener info: ', req.user);
      //console.log('cookkkkkiee', req.cookies);
      const category = categoryCollection.find();
      const result = await category.toArray();
      res.send(result);
    })

    app.post('/category', async (req, res) => {
      const category = req.body;
      console.log(category);
      const result = await categoryCollection.insertOne(category);
      res.send(result);
    })


    // cart API 
    app.get('/carts', async (req, res) => {
      const carts = await cartCollection.find().toArray();
      res.send(carts);
    })

    app.post('/carts', async (req, res) => {
      const carts = req.body;
      console.log(carts);
      const result = await cartCollection.insertOne(carts);
      res.send(result);
    })

    // Queries API 
    app.get('/queries', async (req, res) => {
      const queries = await queriesCollection.find().toArray();
      res.send(queries);
    })

    app.post('/queries', async (req, res) => {
      const queries = req.body;
      console.log(queries);
      const result = await queriesCollection.insertOne(queries);
      res.send(result);
    })

    // Update Query API 
    // Update a query
    app.put('/queries/:id', async (req, res) => {
      try {
        const queryId = req.params.id;
        const queryUpdate = req.body;

        const result = await queriesCollection.updateOne(
          { _id: ObjectId(queryId) },
          { $set: { response: queryUpdate.response, answered: true } }
        );

        if (result.modifiedCount === 1) {
          res.send({ message: 'Query updated successfully' });
        } else {
          res.status(404).send({ error: 'Query not found' });
        }
      } catch (error) {
        console.error('Error updating query:', error);
        res.status(500).send({ error: 'Internal server error' });
      }
    });

    // doctors API

    app.get('/doctors', async (req, res) => {
      const doctors = await doctorsCollection.find().toArray();
      res.send(doctors);
    })

    app.post('/doctors', async (req, res) => {
      const doctors = req.body;
      console.log(doctors);
      const result = await doctorsCollection.insertOne(doctors);
      res.send(result);
    })

    // Appoinment API 
    app.get('/appoinment', async (req, res) => {
      const appoinment = await appoinmentCollection.find().toArray();
      res.send(appoinment);
    })

    app.post('/appoinment', async (req, res) => {
      const appoinment = req.body;
      console.log(appoinment);
      const result = await appoinmentCollection.insertOne(appoinment);
      res.send(result);
    })

    // telemedicine API 
    app.get('/telemedicine-appoinment', async (req, res) => {
      const telemedicine = await telemedicineCollection.find().toArray();
      res.send(telemedicine);
    })

    app.post('/telemedicine-appoinment', async (req, res) => {
      const telemedicine = req.body;
      console.log(telemedicine);
      const result = await telemedicineCollection.insertOne(telemedicine);
      res.send(result);
    })
    app.delete('/telemedicine-appointment/:id', async (req, res) => {
      const id = req.params.id;
      const result = await telemedicineCollection.deleteOne({ _id: ObjectId(id) });
      
      if (result.deletedCount === 1) {
        res.status(200).json({ message: 'Telemedicine appointment deleted successfully' });
      } else {
        res.status(404).json({ message: 'Telemedicine appointment not found' });
      }
    });


    // app.post('/jwt', async (req, res) => {
    //   const logged = req.body;
    //   console.log('user for token', logged);
    //   const token = jwt.sign(logged, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });

    //   res.cookie('token', token, {
    //     httpOnly: true,
    //     secure: true,
    //     sameSite: 'none'
    //   })
    //     .send({ success: true });
    // })

    // app.post('/logout', async (req, res) => {
    //   const logged = req.body;
    //   console.log('logging out', logged);
    //   res.clearCookie('token', { maxAge: 0 }).send({ success: true })
    // })


    //user related api


    //food related API
    // app.get('/foods', async(req,res) =>{
    //   const foods = await foodCollection.find().toArray();
    //   res.send(foods);
    // })
    // app.get('/allfoods', async(req, res) =>{
    //   const cursor = foodCollection.find();
    //   const result = await cursor.toArray();
    //   res.send(result);
    // })

    // app.get('/allfoods', async (req, res) => {
    //   const food = foodCollection.find();
    //   const result = await food.toArray();
    //   res.send(result);
    // })

    // app.post('/allfoods', async (req, res) => {
    //   const food = req.body;
    //   console.log(food);
    //   const result = await foodCollection.insertOne(food);
    //   res.send(result);
    // })

    // app.put('/allfoods/:id', async (req, res) => {
    //   const id = req.params.id;
    //   const filter = { _id: new ObjectId(id) }
    //   const options = { upset: true };
    //   const updatedProduct = req.body;
    //   const food = {
    //     $set: {
    //       foodName: updatedProduct.foodName,
    //       foodCategory: updatedProduct.foodCategory,
    //       quantity: updatedProduct.quantity,
    //       origin: updatedProduct.origin,
    //       price: updatedProduct.price,
    //       descriptions: updatedProduct.descriptions,
    //     }
    //   }
    //   const result = await foodCollection.updateOne(filter, food, options);
    //   res.send(result);
    // })



    // app.get('/topfoods', async (req, res) => {
    //   const topFood = await foodCollection
    //     .find()
    //     .sort({ ordersCount: -1 })
    //     .limit(6)
    //     .toArray();

    //   res.send(topFood);
    // })


    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    //await client.close();
  }
}
run().catch(console.dir);




app.get('/', (req, res) => {
  res.send('server is running');
})


app.listen(port, () => {
  console.log(`server is runnin on port: ${port}`);
})

module.exports = app;