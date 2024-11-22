const express = require('express');
// const axios = require('axios');
const cors = require('cors');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
// const { OpenAIApi, Configuration } = require('openai');
const nodemailer = require('nodemailer');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cookieParser = require('cookie-parser');
const moment = require('moment');
const app = express();
const port = process.env.PORT || 5000;
// const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const stripe = require("stripe")('sk_test_51QNogqJkvpcwTHf6yXtrtABnmQoq0PdtREQYvK3wgWtUgimLcCGyB4WG3Af26HOdbGkxuMC15qjLVwsDfEkLLMab00R3BVz48V');


//middleware
// app.use(cors({
//   origin: [
//     'https://curehub.web.app',
//     'https://curehub.web.app.firebaseapp.com',
//     'http://localhost:5173'
//   ],
//   credentials: true
// }));
app.use(cors({
  origin: function(origin, callback) {
    const allowedOrigins = [
      'https://curehub.web.app',
      'https://curehub.web.app.firebaseapp.com',
      'https://curehub.web.app/payment',
      'http://localhost:5173'
    ];

    // Allow requests with no origin (like mobile apps, Postman, curl, etc.)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'), false);
    }
  },
  credentials: true, // Allow cookies or credentials to be sent with the request
}));
// const allowedOrigins = ['http://localhost:5173', 'https://curehub.web.app'];
// app.use(cors());
// app.use(cors({
//   origin: function(origin, callback) {
//     // Allow requests with no origin (like from mobile apps or curl requests)
//     if (!origin || allowedOrigins.includes(origin)) {
//       callback(null, true);
//     } else {
//       callback(new Error('Not allowed by CORS'));
//     }
//   },
//   methods: ['GET', 'POST', 'PUT', 'DELETE'],
//   allowedHeaders: ['Content-Type'],
// }));
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

    // collection ---> Table
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
    const appointmentCompleteCollection = client.db('curehub').collection('completeAppointment');
    const ContactCollection = client.db('curehub').collection('contacts');
    const PaymentCollection = client.db('curehub').collection('payments');
    

  const formatDateTime = () => {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0'); // Months are zero-based
    const year = now.getFullYear();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');

    return `${day}-${month}-${year} ${hours}:${minutes}:${seconds}`;
};
  

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

    // user related api 
    app.get('/users', async (req, res) => {
      const users = await userCollection.find().toArray();
      res.send(users);
    })


    app.put('/users/membership', async (req, res) => {
      const { email, plan } = req.body;
  
      try {
          if (!email || !plan) {
              return res.status(400).send({ message: "Email and Plan are required" });
          }
  
          // Get the current date and calculate start and end dates
          // const moment = require('moment'); // Ensure you import moment
          const startDate = moment().format("DD-MM-YYYY HH:mm:ss");
          const endDate = moment().add(1, 'months').format("DD-MM-YYYY HH:mm:ss");
  
          // Update the user with the provided email
          const updatedUser = await userCollection.findOneAndUpdate(
              { email }, // Find user by email
              {
                  $set: {
                      plan, // Update the plan
                      membership: true, // Set membership to true
                      "membershipDetails.startDate": startDate, // Add start date
                      "membershipDetails.endDate": endDate, // Add end date
                  }
              },
              { returnDocument: 'after' } // Return the updated document
          );
  
          // if (!updatedUser.value) {
          //     return res.status(404).send({ message: "User not found" });
          // }
  
          res.send({ message: "User updated successfully", user: updatedUser.value });
  
          // Schedule a job to disable membership after 1 month
          setTimeout(async () => {
              await userCollection.updateOne(
                  { email },
                  { $set: { membership: false } }
              );
              console.log(`Membership for ${email} has been disabled.`);
          }, 30 * 24 * 60 * 60 * 1000); // 30 days in milliseconds
      } catch (error) {
          console.error(error);
          res.status(500).send({ message: "Internal Server Error" });
      }
  });
  

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
  
      try {
          const existingUser = await userCollection.findOne({ email: user.email });
          if (existingUser) {
              return res.status(400).send({ message: "User with this email already exists" });
          }
          const createdAt = moment().format("DD-MM-YYYY HH:mm:ss");
          user.createdAt = createdAt;
  
          // Insert the new user into the database
          const result = await userCollection.insertOne(user);
  
          // Send success response
          res.send(result);
      } catch (error) {
          // Handle errors
          console.error(error);
          res.status(500).send({ message: `Internal Server Error ${error}` });
      }
  });

  app.delete('/users/:id', async (req, res) => {
    const userId = req.params.id; // Extract user ID from URL params

    try {
        // Convert userId into MongoDB ObjectId
        const objectId = new ObjectId(userId);

        // Check if the user exists in the database
        const existingUser = await userCollection.findOne({ _id: objectId });

        if (!existingUser) {
            // If the user does not exist, send a 404 response
            return res.status(404).send({ message: "User not found" });
        }

        // Delete the user from the database
        const result = await userCollection.deleteOne({ _id: objectId });

        // Send success response
        res.send({ message: "User deleted successfully", result });
    } catch (error) {
        // Handle errors
        console.error(error);
        res.status(500).send({ message: "Internal Server Error" });
    }
});



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
    try {
        const medicine = req.body;

        // Add the `createdAt` field
        medicine.createdAt = formatDateTime();

        console.log('New Medicine:', medicine);

        // Insert the medicine into the collection
        const result = await medicineCollection.insertOne(medicine);

        // Send the result back to the client
        res.send(result);
    } catch (error) {
        console.error('Error adding medicine:', error);
        res.status(500).send({ error: 'Failed to add medicine' });
    }
});

    app.delete('/medicine/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await medicineCollection.deleteOne(query);
      res.send(result);
    })

    // contactUS API's 
    app.post('/contact-us', async (req, res) => {
      const enquiry = {
        ...req.body,
        createdAt: new Intl.DateTimeFormat('en-GB', {
          timeZone: 'Asia/Dhaka',
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false
        }).format(new Date()) // Format date in dd-mm-yyyy hr:mm:ss in BST
      };
    
      console.log(enquiry);
    
      const result = await ContactCollection.insertOne(enquiry);
      res.send(result);
    });
    
    app.get('/contact-us', async (req, res) => {
      console.log(req.body);
      const contact = ContactCollection.find();
      const result = await contact.toArray();
      res.send(result);
    })
    app.get('/contact-us/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const contact = await ContactCollection.findOne(query);
      
      if (contact) {
        res.send(contact);
      } else {
        res.status(404).send({ message: 'Contact not found' });
      }
    });
    app.get('/contact-us/user/:userID', async (req, res) => {
      const userID = req.params.userID;
      const query = { userID: userID }; // Query by userID
  
      try {
          const contacts = await ContactCollection.find(query).toArray();
          
          if (contacts.length > 0) {
              res.send(contacts);
          } else {
              res.status(404).send({ message: 'No contacts found for this userID' });
          }
      } catch (error) {
          console.error("Error fetching contacts by userID:", error);
          res.status(500).send({ message: 'Internal server error' });
      }
  });
      
    app.delete('/contact-us/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await ContactCollection.deleteOne(query);
      res.send(result);
    })

    app.delete('/contact-us/delete/all', async (req, res) => {
      try {
          const result = await ContactCollection.deleteMany({});
          res.send({ deletedCount: result.deletedCount }); // Send back the count of deleted documents
      } catch (error) {
          console.error('Error deleting contacts:', error);
          res.status(500).send('Internal Server Error');
      }
  });

    // app.put('/contact-us/:id/reply', async (req, res) => {
    //   const id = req.params.id;
    //   const { reply, replyName } = req.body; // Extract reply and replyName from request body
    //   const query = { _id: new ObjectId(id) };
      
    //   // Update the contact with the reply and replyName
    //   const result = await ContactCollection.updateOne(query, {
    //     $set: {
    //       reply: reply,
    //       replyName: replyName
    //     }
    //   });
    
    //   if (result.modifiedCount > 0) {
    //     // Send email to the user
    //     const contact = await ContactCollection.findOne(query);
    //     if (contact && contact.email) {
    //       // Configure your email transport
    //       const transporter = nodemailer.createTransport({
    //         service: 'Gmail', // or any other email service
    //         auth: {
    //           user: 'turzacse@gmail.com', // Your email
    //           pass: 'turza@cse039' // Your email password or app password
    //         }
    //       });
    
    //       const mailOptions = {
    //         from: 'turzacse@gmail.com',
    //         to: contact?.email,
    //         subject: 'Reply to Your Inquiry',
    //         text: `Dear ${contact.name},\n\n${replyName} has replied to your inquiry:\n\n${reply}\n\nBest regards,\nYour Team`
    //       };
    
    //       // Send the email
    //       transporter.sendMail(mailOptions, (error, info) => {
    //         if (error) {
    //           console.error('Error sending email:', error);
    //           return res.status(500).send({ message: 'Error sending email' });
    //         }
    //         console.log('Email sent:', info.response);
    //       });
    //     }
        
    //     res.send({ message: 'Reply sent successfully' });
    //   } else {
    //     res.status(404).send({ message: 'Contact not found or no changes made' });
    //   }
    // });
    
    app.put('/contact-us/:id/reply', async (req, res) => {
      const id = req.params.id;
      const { replymsg } = req.body; // Extract reply message from request body
      const query = { _id: new ObjectId(id) };
    
      // Get the current time in the desired format
      const time = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Asia/Dhaka',
        day: '2-digit',
        month: '2-digit',
        year: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      }).format(new Date());
    
      // Update the contact with the new reply object
      const result = await ContactCollection.updateOne(query, {
        $push: {
          reply: {
            replymsg: replymsg,
            time: time
          }
        }
      });
    
      if (result.modifiedCount > 0) {
        res.send({ message: 'Reply added successfully' });
      } else {
        res.status(404).send({ message: 'Contact not found or no changes made' });
      }
    });


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

    app.get('/carts/:cureHubUser', async (req, res) => {
      const { cureHubUser } = req.params;
      console.log(`Received request for cureHubUser: ${cureHubUser}`);
      try {
        const carts = await cartCollection.find({ cureHubUser }).toArray();
        
        if (carts.length > 0) {
          console.log(`Found ${carts.length} carts`);
          res.send(carts);
        } else {
          console.log('No carts found');
          res.status(404).send({ message: 'Carts not found' });
        }
      } catch (error) {
        console.error('Error fetching carts:', error);
        res.status(500).send({ message: 'Internal Server Error' });
      }
    });
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

    app.get('/doctors/telemedicine', async (req, res) => {
      try {
          const telemedicineDoctors = await doctorsCollection.find({
              status: 'Approved',
              telemedicine: true
          }).toArray();
          
          res.send(telemedicineDoctors);
      } catch (error) {
          console.error('Error fetching telemedicine doctors:', error);
          res.status(500).send({ message: 'An error occurred while fetching telemedicine doctors', error });
      }
  });
  

    app.post('/doctors', async (req, res) => {
      const doctors = req.body;
      console.log(doctors);
      const result = await doctorsCollection.insertOne(doctors);
      res.send(result);
    })
    app.put('/doctors/update/:id', async (req, res) => {
      const { id } = req.params; 
      const updateFields = req.body;
      try {
          const result = await doctorsCollection.updateOne(
              { _id: new ObjectId(id) },
              { $set: updateFields } 
          );
          if (result.matchedCount === 0) {
              res.status(404).send({ message: 'Doctor not found' });
              return;
          }
          res.send({ message: 'Doctor updated successfully', result });
      } catch (error) {
          console.error(error);
          res.status(500).send({ message: 'An error occurred while updating the doctor', error });
      }
  });
  
    app.delete('/doctors/delete-all', async (req, res) => {
      try {
          const result = await doctorsCollection.deleteMany({});
          
          if (result.deletedCount > 0) {
              res.status(200).json({ message: `${result.deletedCount} doctors removed.` });
          } else {
              res.status(404).json({ message: 'No doctors found to delete.' });
          }
      } catch (error) {
          console.error('Error deleting all appointments:', error);
          res.status(500).json({ message: 'Internal Server Error' });
      }
    });

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

    // delete all appoinment 
    app.delete('/appoinment/delete-all', async (req, res) => {
      try {
          const result = await appoinmentCollection.deleteMany({}); // Deletes all documents
          res.send({
              success: true,
              message: 'All appointments have been deleted successfully.',
              deletedCount: result.deletedCount, // Number of documents deleted
          });
      } catch (error) {
          console.error('Error deleting appointments:', error);
          res.status(500).send({
              success: false,
              message: 'Failed to delete appointments. Please try again later.',
          });
      }
  });

    // Appoinment Summary 
    app.get('/appoinment/summary', async (req, res) => {
      try {
          const projection = {
              doctor: 1, // Include `doctor`
              appointedDate: 1, // Include `appointedDate`
              appointedTime: 1, // Include `appointedTime`
              _id: 0, // Exclude `_id` (optional, if you don't want it)
          };

          const appointments = await appoinmentCollection.find({}, { projection }).toArray();

          res.send(appointments);
      } catch (error) {
          console.error('Error fetching appointment summary:', error);
          res.status(500).send({
              success: false,
              message: 'Failed to fetch appointment summary. Please try again later.',
          });
      }
    });

    app.get('/appoinment/summary/:doctorId', async (req, res) => {
      try {
          const { doctorId } = req.params; // Get doctor ID from URL parameter

          const projection = {
              doctor: 1, // Include `doctor`
              appointedDate: 1, // Include `appointedDate`
              appointedTime: 1, // Include `appointedTime`
              _id: 0, // Exclude `_id` (optional)
          };

          // Fetch appointments for the given doctor ID
          const appointments = await appoinmentCollection
              .find({ doctor: doctorId }, { projection })
              .toArray();

          if (appointments.length === 0) {
              return res.status(404).send({
                  success: false,
                  message: 'No appointments found for this doctor.',
              });
          }

          res.send(appointments);
      } catch (error) {
          console.error('Error fetching appointments by doctor ID:', error);
          res.status(500).send({
              success: false,
              message: 'Failed to fetch appointments. Please try again later.',
          });
      }
    });

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

  // Afer Successfull complete a Appointment, store hear
  app.get('/complete/getall/appoinment', async (req, res) => {
    const complete = await appointmentCompleteCollection.find().toArray();
    res.send(complete);
  })

  app.get('/complete/appointment/:cureHubUser', async (req, res) => {
    const cureHubUser = req.params.cureHubUser;
    console.log(`Received request for cureHubUser: ${cureHubUser}`);
    
    try {
        // Find appointments where the cureHubUser matches the provided parameter
        const appointments = await appointmentCompleteCollection.find({ curehubUser: cureHubUser }).toArray();
        
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

  app.post('/complete/appoinment', async (req, res) => {
    const complete = req.body;
    console.log(complete);
    const result = await appointmentCompleteCollection.insertOne(complete);
    res.send(result);
  })
  app.delete('/complete/delete-all', async (req, res) => {
    try {
        // Delete all documents from the collection
        const result = await appointmentCompleteCollection.deleteMany({});
        
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
      const { cureHubUser } = req.params;
      console.log(`Received request for cureHubUser: ${cureHubUser}`);
      try {
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
    // app.post('/telemedicine-appoinment', async (req, res) => {
    //   const telemedicine = req.body;
    //   console.log(telemedicine);
    //   const result = await telemedicineCollection.insertOne(telemedicine);
    //   res.send(result);
    // })
    app.post('/telemedicine-appointment', async (req, res) => {
      try {
          // Extract telemedicine data from the request body
          const telemedicine = req.body;
  
          // Add initial status as "Not Assigned"
          telemedicine.status = "Not Assigned";
  
          console.log(telemedicine);
  
          // Insert the telemedicine data into the collection
          const result = await telemedicineCollection.insertOne(telemedicine);
  
          // Send the result back to the client
          res.status(201).send({
              message: "Telemedicine appointment created successfully",
              result,
          });
      } catch (error) {
          console.error("Error creating telemedicine appointment:", error);
          res.status(500).send({ message: "Internal Server Error" });
      }
  });

  // Update Talemedicine 
  app.put('/telemedicine-appointment/:id', async (req, res) => {
    const { id } = req.params; 
    const { doctorId, doctorName, appointmentDate, appointmentTime } = req.body;
    try {
        
        const updatedAppointment = await telemedicineCollection.findOneAndUpdate(
            { _id: new ObjectId(id) }, 
            {
                $set: { status: 'Assigned' }, 
                $push: {
                    appointments: {
                        doctorId,
                        doctorName,
                        appointmentDate,
                        appointmentTime,
                    },
                },
            },
            { returnDocument: 'after', returnOriginal: false }
        );
        res.status(200).send({
            message: 'Appointment updated successfully',
            updatedAppointment: updatedAppointment.value,
        });
    } catch (error) {
        console.error('Error updating telemedicine appointment:', error);
        res.status(500).send({ message: 'Internal Server Error' });
    }
});

app.put('/telemedicine-pay/:id', async (req, res) => {
  const { id } = req.params; 
  try {
      const updatedAppointment = await telemedicineCollection.findOneAndUpdate(
          { _id: new ObjectId(id) }, 
          {
              $set: { status: 'Paid' }, 
          },
          { returnDocument: 'after', returnOriginal: false }
      );
      res.status(200).send({
          message: 'Appointment updated successfully',
          updatedAppointment: updatedAppointment.value,
      });
  } catch (error) {
      console.error('Error updating telemedicine appointment:', error);
      res.status(500).send({ message: 'Internal Server Error' });
  }
});

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

  //*************** Paymet Mrthd ********//
  app.post('/create-intent', async (req, res) => {
    const { price } = req.body; // Pass amount and currency from frontend
    const amount = parseInt(price*100);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: 'usd',
      payment_method_types: ['card']
    });
    res.send({
      clientSecret: paymentIntent.client_secret,
    })
    
  });


  app.post('/payments', async (req, res) => {
    const { transactionID, amount, type, email, subtype, appointmentId, doctorName } = req.body;

    try {
        const createdAt = moment().format("DD-MM-YYYY HH:mm:ss");

        const paymentData = {
            transactionID,
            amount,
            type,
            email,
            createdAt
        };

        if (type == "Membership Plan") {
            const startDate = createdAt;
            const endDate = moment().add(1, 'months').format("DD-MM-YYYY HH:mm:ss");

            paymentData.details = {
                subtype,
                startDate,
                endDate
            };
        }
        else if (type == 'Appointment Booking') {
            paymentData.details = {
              appointmentId,
              doctorName
            };
        }
        else if (type == 'Telemedicine') {
          paymentData.details = {
            appointmentId,
          };
        }
        else if (type == 'Medicine') {
          const { medicines } = req.body; 
      
          if (Array.isArray(medicines) && medicines.length > 0) {
              paymentData.details = {
                  medicines: medicines.map(item => ({
                      name: item.name,
                      quantity: item.quantity
                  }))
              };
          } else {
              res.status(400).send({ message: "Invalid or missing medicines array" });
              return; 
          }
        }
      
        const result = await PaymentCollection.insertOne(paymentData);

        res.send({ message: "Payment added successfully", result });
    } catch (error) {
        // Handle errors
        console.error(error);
        res.status(500).send({ message: "Internal Server Error" });
    }
  });


app.get('/payments', async (req, res) => {
  try {
      const payments = await PaymentCollection.find().toArray();
      if (payments.length > 0) {
          res.status(200).send(payments);
      } else {
          res.status(404).send({ message: 'No payments found' });
      }
  } catch (error) {
      console.error('Error fetching payments:', error);
      res.status(500).send({ message: 'Internal Server Error' });
  }
});


app.get('/payments/type', async (req, res) => {
  try {
      const { type } = req.query; // Retrieve type from query params

      // Ensure type is provided
      if (!type) {
          return res.status(400).send({ message: "Type is required" });
      }

      // Query payments based on the type
      const payments = await PaymentCollection.find({ type }).toArray();

      // Return the retrieved payments
      res.send({ message: "Payments fetched successfully", payments });
  } catch (error) {
      // Handle errors
      console.error(error);
      res.status(500).send({ message: "Internal Server Error" });
  }
});

app.get('/payments/email', async (req, res) => {
  try {
      const { email } = req.query; // Retrieve email from query params

      // Ensure email is provided
      if (!email) {
          return res.status(400).send({ message: "Email is required" });
      }

      // Query payments based on the email
      const payments = await PaymentCollection.find({ email }).toArray();

      // Return the retrieved payments
      res.send({ message: "Payments fetched successfully", payments });
  } catch (error) {
      // Handle errors
      console.error(error);
      res.status(500).send({ message: "Internal Server Error" });
  }
});


app.delete('/payments/delete/:id', async (req, res) => {
  try {
      const { id } = req.params; // Get ID from URL parameters

      // Validate ID
      if (!id) {
          return res.status(400).send({ message: "ID is required" });
      }

      // Convert string ID to ObjectId
      const objectId = new ObjectId(id);

      // Attempt to delete the document with the matching ID
      const result = await PaymentCollection.deleteOne({ _id: objectId });

      if (result.deletedCount === 1) {
          res.send({ message: "Payment deleted successfully" });
      } else {
          res.status(404).send({ message: "Payment not found" });
      }
  } catch (error) {
      // Handle errors
      console.error(error);
      res.status(500).send({ message: "Internal Server Error" });
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