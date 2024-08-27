const express = require('express');
const cors = require('cors');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
// const { OpenAIApi, Configuration } = require('openai');
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
app.use(bodyParser.json());




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
    const reportsCollection = client.db('curehub').collection('reports');
    const appointmentCancelCollection = client.db('curehub').collection('appointmentCancelation');


    //  a new collection for calls 
    const callCollection = client.db('curehub').collection('calls');


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

    // chatGPT processing........

    app.post('/analysis-report', async (req, res) => {
      const { userId, responses } = req.body; // Example data structure
    
      if (!userId || !responses) {
        return res.status(400).send({ message: 'Invalid data' });
      }
    
      try {
        // Create a prompt for ChatGPT using the responses
        const prompt = `Generate a comprehensive report based on the following responses:\n\n${responses.join('\n')}`;
    
        // Generate the report using OpenAI API
        const completion = await openai.createChatCompletion({
          model: "gpt-3.5-turbo",
          messages: [
            { role: "system", content: "You are a helpful assistant." },
            { role: "user", content: prompt }
          ],
          max_tokens: 1500 // Adjust based on the expected length of the report
        });
    
        const report = completion.data.choices[0].message.content.trim();
    
        // Save the report and responses to the reports collection
        const result = await reportsCollection.insertOne({
          userId,
          responses,
          report,
          createdAt: new Date()
        });
    
        res.send({ message: 'Report generated and saved successfully', reportId: result.insertedId, report });
      } catch (error) {
        console.error('Error generating or saving report:', error);
        res.status(500).send({ message: 'Failed to generate or save report' });
      }
    });


  //   app.get('/reports', async (req, res) => {
  //     try {
  //         // Find all reports in the database
  //         const reports = await reportsCollection.find({}).toArray();
  
  //         res.send({ message: 'Reports retrieved successfully', reports });
  //     } catch (error) {
  //         console.error('Error retrieving reports:', error);
  //         res.status(500).send({ message: 'Failed to retrieve reports' });
  //     }
  // });

//   app.get('/report/:id', async (req, res) => {
//     const { id } = req.params;

//     if (!id) {
//         return res.status(400).send({ message: 'Report ID is required' });
//     }

//     try {
//         // Find the report in the database by ID
//         const report = await reportsCollection.findOne({ _id: new MongoClient.ObjectId(id) });

//         if (!report) {
//             return res.status(404).send({ message: 'Report not found' });
//         }

//         res.send({ message: 'Report retrieved successfully', report });
//     } catch (error) {
//         console.error('Error retrieving report:', error);
//         res.status(500).send({ message: 'Failed to retrieve report' });
//     }
// });

    

    // user related api 
    app.get('/users', async (req, res) => {
      const users = await userCollection.find().toArray();
      res.send(users);
    })

    app.get('/users/:email', async (req, res) => {
      const email = req.params.email;
      try {
        const user = await userCollection.findOne({ email: email });
        if (user) {
          res.send(user);
        } else {
          res.status(404).send({ message: 'User not found' });
        }
      } catch (error) {
        res.status(500).send({ message: 'Internal Server Error' });
      }
    });

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
    app.delete('/carts/:id', async (req, res) => {
      const id = req.params.id;
      const result = await cartCollection.deleteOne({ _id: new ObjectId(id) });
      res.send(result);
    });

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

    app.get('/appoinment/patient/:patient_id', async (req, res) => {
      const patientId = req.params.patient_id;
      const appointments = await appoinmentCollection.find({ patient: patientId }).toArray();
      res.send(appointments);
    });
  
    // Get appointments by doctor_id
    app.get('/appoinment/doctor/:doctor_id', async (req, res) => {
        const doctorId = req.params.doctor_id;
        const appointments = await appoinmentCollection.find({ doctor: doctorId }).toArray();
        res.send(appointments);
    });

    // update Appointment 
    app.put('/appoinment/update/:id', async (req, res) => {
      const id = req.params.id;
      const updateData = req.body;
      const query = { _id: new ObjectId(id) };
      const updateDoc = {
          $set: updateData,
      };
  
      const result = await appoinmentCollection.updateOne(query, updateDoc);
  
      if (result.matchedCount === 1) {
          res.send({ message: 'Appointment updated successfully.' });
      } else {
          res.status(404).send({ message: 'Appointment not found.' });
      }
  });
  
    
    // delete appointment 
    app.delete('/appoinment/delete/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await appoinmentCollection.deleteOne(query);
  
      if (result.deletedCount === 1) {
          res.send({ message: 'Appointment deleted successfully.' });
      } else {
          res.status(404).send({ message: 'Appointment not found.' });
      }
  });



  // Afer cancel a Appointment, store Headers
  app.get('/cancel/getall/appoinment', async (req, res) => {
    const cancel = await appointmentCancelCollection.find().toArray();
    res.send(cancel);
  })
  app.get('/cancel/appointments/:cureHubUser', async (req, res) => {
    const cureHubUser = req.params.cureHubUser;
    console.log(`Received request for cureHubUser: ${cureHubUser}`);
    
    try {
        // Find appointments where the cureHubUser matches the provided parameter
        const appointments = await appointmentCancelCollection.find({ curehubUser: cureHubUser }).toArray();
        
        if (appointments.length > 0) {
            console.log(`Found ${appointments.length} appointments for cureHubUser: ${cureHubUser}`);
            res.status(200).json(appointments);
        } else {
            console.log('No appointments found for the provided cureHubUser');
            res.status(404).json({ message: 'No appointments found for the provided cureHubUser' });
        }
    } catch (error) {
        console.error('Error fetching appointments:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

  app.post('/cancel/appoinment', async (req, res) => {
    const cancel = req.body;
    console.log(cancel);
    const result = await appointmentCancelCollection.insertOne(cancel);
    res.send(result);
  })
  app.delete('/cancel/delete-all', async (req, res) => {
    try {
        // Delete all documents from the collection
        const result = await appointmentCancelCollection.deleteMany({});
        
        if (result.deletedCount > 0) {
            res.status(200).json({ message: `${result.deletedCount} appointments cancelled.` });
        } else {
            res.status(404).json({ message: 'No appointments found to delete.' });
        }
    } catch (error) {
        console.error('Error deleting all appointments:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});
  

    app.get('/telemedicine-appointment', async (req, res) => {
      try {
          const telemedicineAppointments = await telemedicineCollection.find().toArray();
          if (telemedicineAppointments.length > 0) {
              res.status(200).send(telemedicineAppointments);
          } else {
              res.status(404).send({ message: 'No telemedicine appointments found' });
          }
      } catch (error) {
          console.error('Error fetching telemedicine appointments:', error);
          res.status(500).send({ message: 'Internal Server Error' });
      }
  });
  

    app.get('/telemedicine-appoinment/:id', async (req, res) => {
      const id = req.params.id;
      try {
        const telemedicineAppointments = await telemedicineCollection.find({ _id: new ObjectId(id) }).toArray();
        if (telemedicineAppointments.length > 0) {
          res.send(telemedicineAppointments);
        } else {
          res.status(404).send({ message: 'Telemedicine appointments not found' });
        }
      } catch (error) {
        res.status(500).send({ message: 'Internal Server Error' });
      }
    });
    app.get('/telemedicine-appointment/:cureHubUser', async (req, res) => {
      const { cureHubUser } = req.params; // Use destructuring to get cureHubUser from params
      console.log(`Received request for cureHubUser: ${cureHubUser}`);
      
      try {
          // Ensure you use the correct collection and field name
          const telemedicineAppointments = await telemedicineCollection.find({ cureHubUser }).toArray();
  
          if (telemedicineAppointments.length > 0) {
              console.log(`Found ${telemedicineAppointments.length} appointments`);
              res.send(telemedicineAppointments);
          } else {
              console.log('No appointments found');
              res.status(404).send({ message: 'Telemedicine appointments not found' });
          }
      } catch (error) {
          console.error('Error fetching telemedicine appointments:', error);
          res.status(500).send({ message: 'Internal Server Error' });
      }
  });  
    

    app.post('/telemedicine-appoinment', async (req, res) => {
      const telemedicine = req.body;
      console.log(telemedicine);
      const result = await telemedicineCollection.insertOne(telemedicine);
      res.send(result);
    })

    app.delete('/telemedicine/delete/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await telemedicineCollection.deleteOne(query);
  
      if (result.deletedCount === 1) {
          res.send({ message: 'Telemedicine Appointment deleted successfully.' });
      } else {
          res.status(404).send({ message: 'Appointment not found.' });
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