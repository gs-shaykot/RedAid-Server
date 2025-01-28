require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const app = express()
const PORT = process.env.PORT || 5000;
const stripe = require("stripe")(process.env.stripe_SK)
// Middleware

app.use(cors({
    origin: ['http://localhost:5173', 'https://assignment-12-93b12.web.app', 'https://ass-12-delta.vercel.app'],
    credentials: true
}));

app.use(express.json());
app.use(cookieParser());

app.get('/', (req, res) => {
    res.send("ASSIGNMENT-10 SERVER RUNNING")
})

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.db_user}:${process.env.db_pass}@cluster0.x6oak.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {


        const usersCollections = client.db("RedAid").collection('users');
        const requestCollections = client.db("RedAid").collection('requests');
        const DonarsCollections = client.db("RedAid").collection('donars');
        const BlogsCollections = client.db("RedAid").collection('blogs');
        const FundCollections = client.db("RedAid").collection('fundings');

        app.post('/jwt', async (req, res) => {
            const user = req.body
            const token = jwt.sign(user, process.env.jwt_Secret, {
                expiresIn: '1h'
            })
            res
                .cookie('token', token, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
                })
                .send({ success: 'cookie created' })
        })
        app.get('/jwt', async (req, res) => {
            res.send("jwt /jwt working")
        })
        app.post('/jwtlogout', async (req, res) => {
            res
                .clearCookie('token', {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
                })
                .send({ success: 'cookie cleared' })
        })
        app.get('/logout', async (req, res) => {
            res.send("jwt /logout working")
        })


        // TOKEN VERIFIER
        const verifyToken = (req, res, next) => {
            const token = req?.cookies?.token
            if (!token) {
                return res.status(401).send({ message: 'Token not found to verify' })
            }
            jwt.verify(token, process.env.jwt_Secret, (err, decoded) => {
                if (err) {
                    return res.status(401).send({ message: 'Unauthorization Error' })
                }
                req.user = decoded
                next()
            })
        }

        // User Api:
        app.post('/users', async (req, res) => {
            const user = req.body;
            const result = await usersCollections.insertOne(user);
            res.send(result);
        });

        app.get('/users', async (req, res) => {
            const page = parseInt(req.query.page)
            const size = parseInt(req.query.size)
            const email = req.query.email
            if (email) {
                const query = { email: email }
                const userCount = await usersCollections.countDocuments(query)
                const Alluser = await usersCollections.find(query).skip(page * size).limit(size).toArray()
                if (Alluser) {
                    res.send({ Alluser, userCount })
                }
                else {
                    res.status(404).send({ message: "Request not found" })
                }
            }
            else {
                const userCount = await usersCollections.countDocuments()
                const result = await usersCollections.find().skip(page * size).limit(size).toArray()
                // const result = await requestCollections.find().toArray()
                res.send({ result, userCount })
            }
        })

        app.get('/users/filter', verifyToken, async (req, res) => {
            const email = req.query.email
            const user = await usersCollections.findOne({ email: email })
            if (user) {
                res.send(user)
            }
            else {
                res.status(404).send({ message: "User not found" })
            }
        })

        app.get('/users/search', async (req, res) => {
            const { blood, District, Upazila } = req.query;
            const query = {
                ...(blood && { blood }),
                ...(District && { District }),
                ...(Upazila && { Upazila }),
            };
            console.log(blood, " ", District, " ", Upazila)
            const result = await usersCollections.find(query).toArray();
            res.send(result);
        });



    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);


app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});