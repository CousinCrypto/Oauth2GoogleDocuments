const express = require("express");
const bodyParser = require("body-parser");
const { MongoClient, ServerApiVersion } = require('mongodb');
const axios = require("axios");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

const { google } = require('googleapis');

require('dotenv').config();


const CLIENT_ID = process.env.CLIENT_ID
const CLIENT_SECRET = process.env.CLIENT_SECRET
const REDIRECT_URI = 'http://localhost:3000/oauth2callback';
const SCOPES = ['https://www.googleapis.com/auth/documents', 'https://www.googleapis.com/auth/drive'];


const oauth2Client = new google.auth.OAuth2(
    CLIENT_ID,
    CLIENT_SECRET,
    REDIRECT_URI
);


app.use(bodyParser.json());
app.use(express.static(__dirname));


app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/index', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});


app.get('/auth-url', (req, res) => {
    const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
    });
    console.log(authUrl)
    res.json({ url: authUrl });
});

app.get('/oauth2callback', async (req, res) => {
    const { code } = req.query;
    try {
        const { tokens } = await oauth2Client.getToken(code);
        oauth2Client.setCredentials(tokens);

        const docs = google.docs({ version: 'v1', auth: oauth2Client });
        const createResponse = await docs.documents.create({
            requestBody: {
                title: 'Titl',
            },
        });

        const documentId = createResponse.data.documentId;
        await docs.documents.batchUpdate({
            documentId,
            requestBody: {
                requests: [{
                    insertText: {
                        location: { index: 1 },
                        text: 'Hello world',
                    },
                }],
            },
        });

        res.send('Document created successfully!');
    } catch (error) {
        console.error('Error during authentication or document creation:', error);
        res.send('Error occurred');
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});