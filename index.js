const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
const app = express();

// Facebook App credentials
const FACEBOOK_APP_ID = '200424423651082'; 
const FACEBOOK_APP_SECRET = '2a9918c6bcd75b94cefcbb5635c6ad16';
const FACEBOOK_REDIRECT_URI = 'https://callbackmain.vercel.app/auth/facebook/callback'; // URL callback yang digunakan

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Menyediakan halaman input username dan password (hanya contoh, menggunakan OAuth lebih baik)
app.get('/', (req, res) => {
    res.send(`
        <h1>Login dengan Facebook</h1>
        <form action="/login" method="POST">
            <label for="email">Email:</label><br>
            <input type="text" id="email" name="email" required><br>
            <label for="password">Password:</label><br>
            <input type="password" id="password" name="password" required><br>
            <button type="submit">Login</button>
        </form>
        <br>
        <a href="/login/facebook">Login dengan Facebook</a>
    `);
});

// Langkah 1: Redirect ke halaman login Facebook
app.get('/login/facebook', (req, res) => {
    const facebookAuthUrl = `https://www.facebook.com/v15.0/dialog/oauth?client_id=${FACEBOOK_APP_ID}&redirect_uri=${FACEBOOK_REDIRECT_URI}&scope=email,public_profile`;
    res.redirect(facebookAuthUrl);
});

// Langkah 2: Menangani callback dari Facebook setelah login berhasil
app.get('/auth/facebook/callback', async (req, res) => {
    const { code } = req.query;

    if (!code) {
        return res.status(400).send('Kode otorisasi tidak ada');
    }

    try {
        // Tukar kode otorisasi dengan token akses
        const response = await axios.get('https://graph.facebook.com/v15.0/oauth/access_token', {
            params: {
                client_id: FACEBOOK_APP_ID,
                client_secret: FACEBOOK_APP_SECRET,
                redirect_uri: FACEBOOK_REDIRECT_URI,
                code,
            },
        });

        const { access_token } = response.data;

        // Ambil data pengguna dengan menggunakan token akses
        const userInfo = await axios.get('https://graph.facebook.com/me', {
            params: {
                access_token,
                fields: 'id,name,email',
            },
        });

        res.send(`
            <h1>Login Berhasil</h1>
            <p>ID Pengguna Facebook: ${userInfo.data.id}</p>
            <p>Nama: ${userInfo.data.name}</p>
            <p>Email: ${userInfo.data.email}</p>
            <p>Access Token: ${access_token}</p>
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
