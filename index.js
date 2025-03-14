const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
const app = express();

// Facebook App credentials
const FACEBOOK_APP_ID = '200424423651082'; 
const FACEBOOK_APP_SECRET = '2a9918c6bcd75b94cefcbb5635c6ad16';
const FACEBOOK_REDIRECT_URI = 'http://localhost:3000/auth/facebook/callback'; // your callback URL

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Step 1: Redirect to Facebook Login
app.get('/login', (req, res) => {
    const facebookAuthUrl = `https://www.facebook.com/v15.0/dialog/oauth?client_id=${FACEBOOK_APP_ID}&redirect_uri=${FACEBOOK_REDIRECT_URI}&scope=email,public_profile`;
    res.redirect(facebookAuthUrl);
});

// Step 2: Handle the redirect from Facebook after successful login
app.get('/auth/facebook/callback', async (req, res) => {
    const { code } = req.query;

    if (!code) {
        return res.status(400).send('No code provided');
    }

    try {
        // Step 3: Exchange the authorization code for an access token
        const response = await axios.get('https://graph.facebook.com/v15.0/oauth/access_token', {
            params: {
                client_id: FACEBOOK_APP_ID,
                client_secret: FACEBOOK_APP_SECRET,
                redirect_uri: FACEBOOK_REDIRECT_URI,
                code,
            },
        });

        const { access_token } = response.data;

        // Step 4: Use the access token to fetch user data
        const userInfo = await axios.get('https://graph.facebook.com/me', {
            params: {
                access_token,
                fields: 'id,name,email',
            },
        });

        // Display user info
        res.send(`
            <h1>Login Successful</h1>
            <p>Facebook User ID: ${userInfo.data.id}</p>
            <p>Name: ${userInfo.data.name}</p>
            <p>Email: ${userInfo.data.email}</p>
            <p>Access Token: ${access_token}</p>
        `);
    } catch (err) {
        console.error('Error during authentication:', err.message);
        res.status(500).send('Error logging in with Facebook.');
    }
});

// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

module.exports = app;
