require('dotenv').config()
const express = require('express')
var cors = require('cors')
const app = express()
const { MongoClient, ServerApiVersion } = require('mongodb');
const port = process.env.PORT || 5000

app.use(cors({
    origin: [
        "http://localhost:5173",
    ],
    credentials: true
}))
app.use(express.json())



// const uri = `mongodb+srv://${process.env.USER_NAME}:${process.env.USER_PASS}@cluster0.f0yik.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
const uri = `mongodb+srv://${process.env.USER_NAME}:${process.env.USER_PASS}@cluster0.f0yik.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});


async function run() {
    const userCollection = client.db('parcelProDB').collection('users')
  try {
    
    app.get('/', (req, res) => {
        res.send('Hello World!')
    })

    app.post('/users',async (req,res)=>{
        const userData = req.body
        const query = {email: userData.email}
        const isExistUser = await userCollection.findOne(query)
        if(isExistUser){
          return res.send({message: "User already exist!", insertedId:null})
        }
        const result = await userCollection.insertOne(userData)
        res.send(result)
    })

    app.listen(port, () => {
        console.log(`Example app listening on port ${port}`)
      })

      
    // await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.log);


