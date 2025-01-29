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
            const result = await usersCollections.find(query).toArray();
            res.send(result);
        });


        app.patch('/users/:id', verifyToken, async (req, res) => {
            const id = req.params.id
            const filter = { _id: new ObjectId(id) }
            const options = { upsert: true };
            const updateDoc = {
                $set: req.body
            }
            const result = await usersCollections.updateOne(filter, updateDoc, options)
            res.send(result)
        })

        // Search 
        app.get('users/search', async (req, res) => {
            const { group, District, Upazila } = req.query
            const query = {}
            if (group) query.group = group
            if (District) query.District = District
            if (Upazila) query.Upazila = Upazila
            const result = await requestCollections.find(query).toArray()
            res.send(result)
        })


        // Admin Check API 
        app.get('/users/admin/:email', async (req, res) => {
            const ReqEmail = req.params?.email
            // if (ReqEmail !== req.user?.email) {
            //     return res.status(403).send({ message: "forbidden access" })
            // }
            const query = { email: ReqEmail }
            const user = await usersCollections.findOne(query)
            let admin = false
            if (user) {
                admin = user?.role == "admin"
            }
            res.send({ admin })
        })

        // Volunteer Check

        app.get('/users/mod/volunteer/:email', async (req, res) => {
            const ReqEmail = req.params?.email
            // if (ReqEmail !== req.user?.email) {
            //     return res.status(403).send({ message: "forbidden access" })
            // }
            const query = { email: ReqEmail }
            const user = await usersCollections.findOne(query)
            let volunteer = false
            if (user) {
                volunteer = user?.role == "volunteer"
            }
            res.send({ volunteer })
        })

        // Donation Request API's:


        app.post('/requests', verifyToken, async (req, res) => {
            const request = req.body
            const result = await requestCollections.insertOne(request)
            res.send(result)
        })
        app.get('/requests', async (req, res) => {
            const page = parseInt(req.query.page)
            const size = parseInt(req.query.size)
            const email = req.query.email
            if (email) {
                const query = { requesterEmail: email }
                const rqstCount = await requestCollections.countDocuments(query)
                const userReq = await requestCollections.find(query).skip(page * size).limit(size).toArray()
                if (userReq) {
                    res.send({ userReq, rqstCount })
                }
                else {
                    res.status(404).send({ message: "Request not found" })
                }
            }
            else {
                const totalCount = await requestCollections.countDocuments()
                const result = await requestCollections.find().skip(page * size).limit(size).toArray()
                // const result = await requestCollections.find().toArray()
                res.send({ result, totalCount })
            }
        })
        app.get('/requests/pending', async (req, res) => {
            const page = parseInt(req.query.page)
            const size = parseInt(req.query.size)
            const query = { donationStatus: 'pending' }
            const totalCount = await requestCollections.countDocuments(query)
            const result = await requestCollections.find(query).skip(page * size).limit(size).toArray()
            // const result = await requestCollections.find().toArray()
            res.send({ result, totalCount })
        })

        app.get('/requests/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id: new ObjectId(id) }
            const result = await requestCollections.findOne(query)
            res.send(result)
        })

        app.get('/requests/sorted/ascending', verifyToken, async (req, res) => {
            const email = req.query.email
            if (email) {
                const query = { requesterEmail: email };
                const cursor = requestCollections.find(query).sort({ createdDate: -1 }).limit(3);
                const result = await cursor.toArray();
                if (result) {
                    res.send(result);
                }
                else {
                    res.status(404).send({ message: "Request not found" })
                }
            }
            else {
                const cursor = requestCollections.find().sort({ createdDate: 1 });
                const result = await cursor.toArray();
                res.send(result);
            }
        });

        app.patch('/requests/:id', verifyToken, async (req, res) => {
            const id = req.params.id
            const filter = { _id: new ObjectId(id) }
            const options = { upsert: true }
            const updateDoc = {
                $set: req.body
            }
            const result = await requestCollections.updateOne(filter, updateDoc, options)
            res.send(result)
        })

        app.delete('/requests/:id', verifyToken, async (req, res) => {
            const id = req.params.id
            const filter = { _id: new ObjectId(id) };
            const result = await requestCollections.deleteOne(filter)
            res.send(result)
        })

        // DONAR API
        app.post('/donar', verifyToken, async (req, res) => {
            const donationInfo = req.body
            const result = await DonarsCollections.insertOne(donationInfo)
            res.send(result)
        })

        app.get('/donar', verifyToken, async (req, res) => {
            const email = req.query.email;
            if (email) {
                const query = { DonorEmail: email }
                const cursor = await DonarsCollections.find(query).sort({ respondedAt: 1 }).limit(3)
                const result = await cursor.toArray()
                if (result) {
                    res.send(result);
                }
                else {
                    res.status(404).send({ message: "Request not found" })
                }
            }
            else {
                const result = await DonarsCollections.find().toArray()
                res.send(result)
            }
        })


        app.patch('/donar/:id', verifyToken, async (req, res) => {
            const id = req.params.id
            const filter = { _id: new ObjectId(id) }
            const options = { upsert: true }
            const updateDoc = {
                $set: req.body
            }
            const result = await DonarsCollections.updateOne(filter, updateDoc, options)
            res.send(result)
        })

        app.delete('/donar/:id', verifyToken, async (req, res) => {
            const id = req.params.id
            const filter = { _id: new ObjectId(id) };
            const result = await DonarsCollections.deleteOne(filter)
            res.send(result)
        })

        // BLOG API

        app.post('/blogs', async (req, res) => {
            const blog = req.body
            const result = await BlogsCollections.insertOne(blog)
            res.send(result)
        })

        app.get('/blogs', async (req, res) => {
            const page = parseInt(req.query.page)
            const size = parseInt(req.query.size)
            const blogCount = await BlogsCollections.countDocuments()
            const result = await BlogsCollections.find().skip(page * size).limit(size).toArray()
            res.send({ result, blogCount })
        })

        app.get('/blogs/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id: new ObjectId(id) }
            const result = await BlogsCollections.findOne(query)
            res.send(result)
        })

        app.patch('/blogs/:id', async (req, res) => {
            const id = req.params.id
            const filter = { _id: new ObjectId(id) }
            const options = { upsert: true }
            const updateDoc = {
                $set: req.body
            }
            const result = await BlogsCollections.updateOne(filter, updateDoc, options)
            res.send(result)
        })
        app.delete('/blogs/:id', async (req, res) => {
            const id = req.params.id
            const filter = { _id: new ObjectId(id) };
            const result = await BlogsCollections.deleteOne(filter)
            res.send(result)
        })

        // Funding API:

        app.post('/makeAfunding', async (req, res) => {
            const fundAmount = req.body
            const result = await FundCollections.insertOne(fundAmount)
            res.send(result)
        })

        app.get('/makeAfunding', async (req, res) => {
            const result = await FundCollections.find().toArray()
            res.send(result)
        })

        // PAYMENT GATEWAY API  
        app.post('/create-payment-intent', async (req, res) => {
            const { price } = req.body;

            if (!price || price < 0.5) {
                return res.status(400).send({
                    error: "Amount must be at least $0.50.",
                });
            }

            const amount = parseInt(price * 100);

            try {
                const paymentIntent = await stripe.paymentIntents.create({
                    amount: amount,
                    currency: "usd",
                    payment_method_types: ["card"],
                });

                res.send({
                    clientSecret: paymentIntent.client_secret,
                });
            } catch (error) {
                res.status(401).send({
                    error: error.message,
                });
            }
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