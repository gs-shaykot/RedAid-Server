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

    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);


app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});