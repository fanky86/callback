const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
const app = express();

// Credential Facebook App
const FACEBOOK_APP_ID = '200424423651082'; 
const FACEBOOK_APP_SECRET = '2a9918c6bcd75b94cefcbb5635c6ad16';
const FACEBOOK_REDIRECT_URI = 'https://callbackmain.vercel.app/auth/facebook/callback'; // URL callback kamu

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
        <br>
        <a href="/login/facebook">Login with Facebook</a>
    `);
});

// Langkah 1: Redirect ke halaman login Facebook
app.get('/login/facebook', (req, res) => {
    const facebookAuthUrl = `https://www.facebook.com/v15.0/dialog/oauth?client_id=${FACEBOOK_APP_ID}&redirect_uri=${FACEBOOK_REDIRECT_URI}&scope=email,public_profile`;
    res.redirect(facebookAuthUrl);
});

// Langkah 2: Menangani input login menggunakan email dan password (ini hanya contoh, tidak disarankan untuk produksi)
app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        // Mengirim permintaan login ke Facebook (harus diganti dengan implementasi OAuth yang tepat)
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

// Langkah 3: Menangani redirect dari Facebook setelah login berhasil
app.get('/auth/facebook/callback', async (req, res) => {
    const { code } = req.query;

    if (!code) {
        return res.status(400).send('Kode otorisasi tidak ada');
    }

    try {
        // Langkah 4: Tukar kode otorisasi dengan token akses
        const response = await axios.get('https://graph.facebook.com/v15.0/oauth/access_token', {
            params: {
                client_id: FACEBOOK_APP_ID,
                client_secret: FACEBOOK_APP_SECRET,
                redirect_uri: FACEBOOK_REDIRECT_URI,
                code,
            },
        });

        const { access_token } = response.data;

        // Langkah 5: Gunakan token akses untuk mengambil data pengguna
        const userInfo = await axios.get('https://graph.facebook.com/me', {
            params: {
                access_token,
                fields: 'id,name,email',
            },
        });

        // Menampilkan informasi pengguna
        res.send(`
            <h1>Login Berhasil</h1>
            <p>ID Pengguna Facebook: ${userInfo.data.id}</p>
            <p>Nama: ${userInfo.data.name}</p>
            <p>Email: ${userInfo.data.email}</p>
            <p>Token Akses: ${access_token}</p>
        `);
    } catch (err) {
        console.error('Terjadi kesalahan selama otentikasi:', err.message);
        res.status(500).send('Gagal login menggunakan Facebook.');
    }
});

// Menjalankan server
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server berjalan di http://localhost:${port}`);
});

module.exports = app;
