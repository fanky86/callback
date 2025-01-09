const express = require('express');
const axios = require('axios');
const app = express();

const FACEBOOK_APP_ID = '9299226340096866'; 
const FACEBOOK_APP_SECRET = '156677e2edbcf7075472870f8c627020'; // Gunakan variabel lingkungan
const REDIRECT_URI = 'https://callbackmain.vercel.app/callback'; // Ganti dengan Redirect URI Anda

// Menangani permintaan ke root '/'
app.get('/', (req, res) => {
    res.send('<h1>Welcome to the Facebook Login App</h1>');
});

// 1. Endpoint untuk mengarahkan pengguna ke Facebook Login
app.get('/login', (req, res) => {
    const facebookLoginURL = `https://www.facebook.com/v12.0/dialog/oauth?client_id=${FACEBOOK_APP_ID}&redirect_uri=${REDIRECT_URI}&scope=email,public_profile&response_type=code`;
    res.redirect(facebookLoginURL); // Redirect pengguna ke halaman login Facebook
});

// 2. Endpoint untuk menangani callback setelah login Facebook
app.get('/callback', async (req, res) => {
    const { code, error } = req.query;

    // Menangani error jika ada
    if (error) {
        return res.status(400).send(`Error occurred: ${error}`);
    }

    // Menangani jika authorization code tidak ditemukan
    if (!code) {
        return res.status(400).send('Authorization code not found.');
    }

    try {
        // Menukarkan authorization code dengan access token
        const tokenResponse = await axios.get('https://graph.facebook.com/v12.0/oauth/access_token', {
            params: {
                client_id: FACEBOOK_APP_ID,
                redirect_uri: REDIRECT_URI,
                client_secret: FACEBOOK_APP_SECRET,
                code: code
            }
        });

        const { access_token } = tokenResponse.data;

        // Mengambil data pengguna dari Facebook
        const userResponse = await axios.get('https://graph.facebook.com/me', {
            params: {
                access_token: access_token,
                fields: 'id,name,email'
            }
        });

        const userData = userResponse.data;

        // Menampilkan data pengguna di halaman
        res.send(`
            <h1>Welcome, ${userData.name}</h1>
            <p>Your email: ${userData.email}</p>
            <p>Your Facebook ID: ${userData.id}</p>
            <p>Your Access Token: ${access_token}</p>
        `);
    } catch (err) {
        console.error('Error fetching data from Facebook API:', err.message);
        res.status(500).send('Error fetching data from Facebook API');
    }
});

// Menjalankan server
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

// Exporting the serverless function for Vercel
module.exports = app;
