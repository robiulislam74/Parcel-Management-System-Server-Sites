require('dotenv').config()
const express = require('express')
var cors = require('cors')
const app = express()
var jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 5000

app.use(cors({
  origin: [
    "http://localhost:5173",
  ],
  credentials: true
}))
app.use(express.json())


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
  const BookedParcelDB = client.db('parcelProDB').collection('bookedParcel')
  try {

    // jwt related API
    app.post('/jwt', (req, res) => {
      const userEmail = req.body
      const token = jwt.sign({
        data: userEmail
      }, `${process.env.SECRET_TOKEN}`, { expiresIn: '1h' });
      res.send({ token })
    })

    // Verify Token
    const verifyToken = (req, res, next) => {
      console.log("Request Interceptor token:", req?.headers?.authorization)
      if (!req?.headers?.authorization) {
        return res.status(401).send({ message: 'unAuthorization Access' })
      }

      const token = req.headers.authorization.split(' ')[1]
      jwt.verify(token, `${process.env.SECRET_TOKEN}`, function (err, decoded) {
        if (err) {
          return res.status(401).send({ message: 'unAuthorization Access' })
        }
        req.decoded = decoded
        next()
      });
    }

    // CRUD Operation Here...
    app.get('/', (req, res) => {
      res.send('Hello World!')
    })

    // Admin Check api
    app.get('/users/admin/:email', async (req, res) => {
      const email = req?.params?.email
      // if(email !== req?.decoded?.email){
      //   return res.status(403).send({ message: 'Forbidden Access' })
      // }

      const query = { email: email }
      const user = await userCollection.findOne(query)
      let isAdmin = false;

      if (user) {
        isAdmin = user?.role == 'Admin'
      }
      res.send({ isAdmin })
    })

    // deliveryMen Check api
    app.get('/users/deliveryMen/:email', async (req, res) => {
      const email = req?.params?.email
      // if(email !== req?.decoded?.email){
      //   return res.status(403).send({ message: 'Forbidden Access' })
      // }

      const query = { email: email }
      const user = await userCollection.findOne(query)
      let isDeliveryMen = false;

      if (user) {
        isDeliveryMen = user?.role == 'DeliveryMen'
      }
      res.send({ isDeliveryMen })
    })

    // user Check api
    app.get('/users/user/:email', async (req, res) => {
      const email = req?.params?.email
      // if(email !== req?.decoded?.email){
      //   return res.status(403).send({ message: 'Forbidden Access' })
      // }

      const query = { email: email }
      const user = await userCollection.findOne(query)
      let isUser = false;

      if (user) {
        isUser = user?.role == 'User'
      }
      res.send({ isUser })
    })

    app.get('/bookedParcel', async (req, res) => {
      const bookedData = req.body
      const result = await BookedParcelDB.find(bookedData).toArray()
      res.send(result)
    })

    app.get('/bookedMyParcel/:email', async (req, res) => {
      const email = req.params.email
      const query = {email:email}
      const bookedMyParcel = await BookedParcelDB.find(query).toArray()
      res.send(bookedMyParcel)
    })

    app.get('/allDeliveryMen',async (req,res)=>{
      const query = {role:'DeliveryMen'}
      const findAllDeliveryMen = await userCollection.find(query).toArray()
      res.send(findAllDeliveryMen)
    })

    // app.get('/manageParcel/:id',async(req,res)=>{
    //   const parcelId = req.params.id
    //   const query = {_id: new ObjectId(parcelId)}
    //   const result = await BookedParcelDB.findOne(query)
    //   res.send(result)
    // })

    app.get('/users/:email', async (req, res) => {
      const email = req.params.email
      const query = {email:email}
      const findUser = await userCollection.findOne(query)
      res.send(findUser)
    })

    app.post('/users', async (req, res) => {
      const userData = req.body
      const query = { email: userData.email }
      const isExistUser = await userCollection.findOne(query)
      if (isExistUser) {
        return res.send({ message: "User already exist!", insertedId: null })
      }
      const result = await userCollection.insertOne(userData)
      res.send(result)
    })

    app.post('/bookedParcel', async (req, res) => {
      const bookedData = req.body
      const result = await BookedParcelDB.insertOne(bookedData)
      res.send(result)
    })

    // Updated parcel
    app.patch('/updateBookedParcel/update/:id', async (req, res) => {
      const parcel = req.body
      const parcelId = req.params.id
      const query = { _id: new ObjectId(parcelId) }
      const updateDoc = {
        $set: {
          phone: parcel.phone,
          parcelType: parcel.parcelType,
          parcelWeight: parcel.parcelWeight,
          receiverName: parcel.receiverName,
          receiverPhone: parcel.receiverPhone,
          deliveryAddress: parcel.deliveryAddress,
          deliveryDate: parcel.deliveryDate,
          latitude: parcel.latitude,
          longitude: parcel.longitude,
          price: parcel.price
        }
      }
      const updateResult = await BookedParcelDB.updateOne(query, updateDoc)
      res.send(updateResult)
    })

    // User Info Update
    app.patch('/users/update/:id',async(req,res)=>{
      const userId = req.params.id
      const user = req.body
      const query = {_id: new ObjectId(userId)}
      const updateDoc ={
        $set: {
          name: user.name,
          photoURL: user.photoURL
        }
      }
      const updateInfo = await userCollection.updateOne(query,updateDoc)
      res.send(updateInfo)
    })

    // manage Parcel DeliveryMen Assign here
    app.patch('/manageParcel/:id',async(req,res)=>{
      const parcelId = req.params.id
      const parcelInfo = req.body
      console.log("ParcelInfo:",parcelInfo)
      const query = {_id: new ObjectId(parcelId)}
      const updateDoc ={
        $set: {
          status: parcelInfo.status,
          deliveryMenId: parcelInfo.deliveryMenId,
          approxDate: parcelInfo.approxDate
        }
      }
      const updateInfo = await BookedParcelDB.updateOne(query,updateDoc,{upsert:true})
      res.send(updateInfo)
    })

    // Delete Parcel
    app.delete('/updateBookedParcel/update/:id', async (req, res) => {
      const parcelId = req.params.id
      const query = { _id: new ObjectId(parcelId) }
      const deleteParcel = await BookedParcelDB.deleteOne(query)
      res.send(deleteParcel)
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


