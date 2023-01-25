const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 5000;
const jwt = require('jsonwebtoken')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

//require('crypto').randomBytes(64).toString("hex")

require('dotenv').config()
//2 middleware
app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.xgfn0ly.mongodb.net/?retryWrites=true&w=majority`;

console.log(process.env.DB_USER, process.env.DB_PASSWORD)
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


//verifying JWT token which we got from client site


// function verifyJWT(req, res, next) {
//     // next()
//     console.log()
//     const authHeader = req.headers.authorization

//     if (!authHeader) {
//         res.status(401).send({ message: 'unauthorized access' })
//     }

//     const token = authHeader.split(' ')[1]

//     jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
//         if (err) {
//             res.status(401).send({ message: 'unauthorized access' })
//         }
//         req.decoded = decoded
//         next();
//     })
// }


function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization
    if (!authHeader) {
        return res.status(401).send({ message: 'unauthorized access' })
    }
    const token = authHeader.split(' ')[1]

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
        if (err) {
            return res.status(401).send({ message: 'unauthorized access' })
        }

        req.decoded = decoded;
        next()

    })
}

async function run() {

    try {
        const serviceCollection = client.db('geniusCar').collection('services')
        const orderCollection = client.db('geniusCar').collection('orders')


        //jwt token implementation
        app.post('/jwt', async (req, res) => {
            const user = req.body
            console.log(user);
            //user er data will be used as payload
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1hr' })
            res.send({ token })
        })
        //end jwt

        //load all data
        app.get('/services', async (req, res) => {
            const query = {};
            const cursor = serviceCollection.find(query);
            const services = await cursor.toArray();
            res.send(services);
        })

        //to load specific data using data filtering
        app.get('/services/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const service = await serviceCollection.findOne(query);
            res.send(service)
        })


        //orders API

        app.get('/orders', verifyJWT, async (req, res) => {
            const decoded = req.decoded;
            console.log('inside orders api', decoded)

            if (decoded.email !== req.query.email) {
                res.status(403).send({ message: 'Unauthorized Access' })
            }
            let query = {};
            // 
            if (req.query.email) {
                query = { email: req.query.email }
            }

            const cursor = orderCollection.find(query)
            const orders = await cursor.toArray();
            res.send(orders);
        })


        app.post('/orders', async (req, res) => {
            const order = req.body;
            const result = await orderCollection.insertOne(order);
            res.send(result);
        })


        app.patch('/orders/:id', verifyJWT, async (req, res) => {
            const id = req.params.id;
            const status = req.body.status
            const query = { _id: ObjectId(id) };
            const updatedDoc = {
                $set: {
                    status: status
                }
            }

            const result = await orderCollection.updateOne(query, updatedDoc);
            res.send(result);
        })


        app.delete('/orders/:id', verifyJWT, async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await orderCollection.deleteOne(query)
            res.send(result);
        })

    }


    finally {

    }

}
run().catch(err => console.log(err))


app.get('/', (req, res) => {
    res.send("genius server running successfully")
})

app.listen(port, () => {
    console.log(`genius server running on port ${port}`)
})