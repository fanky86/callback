const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
const app = express();

const FACEBOOK_APP_ID = '200424423651082'; 
const FACEBOOK_APP_SECRET = '2a9918c6bcd75b94cefcbb5635c6ad16';

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Menyediakan halaman input username dan password
app.get('/', (req, res) => {
    res.send(`
        <h1>Facebook Login</h1>
        <form action="/login" method="POST">
            <label for="email">Email:</label><br>
            <input type="text" id="email" name="email" required><br>
            <label for="password">Password:</label><br>
            <input type="password" id="password" name="password" required><br>
            <button type="submit">Login</button>
        </form>
    `);
});

// Menangani input login
app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        // Mengirim permintaan login ke Facebook
        const response = await axios.post('https://graph.facebook.com/auth/login', null, {
            params: {
                email: email,
                password: password,
                access_token: `${FACEBOOK_APP_ID}|${FACEBOOK_APP_SECRET}`,
                format: 'json',
                sdk: 'ios',
                generate_session_cookies: 1
            }
        });

        const data = response.data;

        if (data.error) {
            return res.status(400).send(`Login error: ${data.error.message}`);
        }

        const { access_token, session_cookies, uid } = data;

        res.send(`
            <h1>Login Successful</h1>
            <p>Facebook User ID: ${uid}</p>
            <p>Access Token: ${access_token}</p>
            <p>Cookies: ${JSON.stringify(session_cookies)}</p>
        `);
    } catch (err) {
        console.error('Error during login:', err.message);
        res.status(500).send('Failed to login to Facebook. Please check your credentials.');
    }
});

// Menjalankan server
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

module.exports = app;
