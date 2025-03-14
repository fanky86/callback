const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
const app = express();

// Kredensial Facebook App
const FACEBOOK_APP_ID = '200424423651082';
const FACEBOOK_APP_SECRET = '2a9918c6bcd75b94cefcbb5635c6ad16';
const FACEBOOK_REDIRECT_URI = 'https://callbackmain.vercel.app/auth/facebook/callback'; // Ganti dengan redirect URI kamu

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Halaman utama - menyediakan login manual dan login via Facebook
app.get('/', (req, res) => {
    res.send(`
        <h1>Login</h1>
        <form action="/login" method="POST">
            <label for="email">Email:</label><br>
            <input type="text" id="email" name="email" required><br>
            <label for="password">Password:</label><br>
            <input type="password" id="password" name="password" required><br>
            <button type="submit">Login Manual</button>
        </form>
        <br>
        <a href="/login/facebook">Login dengan Facebook</a>
    `);
});

// Menangani login manual (untuk testing saja, tidak aman untuk produksi!)
app.post('/login', (req, res) => {
    const { email, password } = req.body;

    // ⚠️ Contoh sederhana, tidak melakukan verifikasi atau hash!
    res.send(`
        <h2>Login Manual Berhasil (Sementara)</h2>
        <p>Email: ${email}</p>
        <p>Password: ${password}</p>
        <p><i>Catatan: Ini hanya simulasi login. Jangan digunakan di produksi tanpa verifikasi!</i></p>
    `);
});

// Langkah 1: Redirect ke halaman login Facebook
app.get('/login/facebook', (req, res) => {
    const facebookAuthUrl = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${FACEBOOK_APP_ID}&redirect_uri=${FACEBOOK_REDIRECT_URI}&scope=email,public_profile`;
    res.redirect(facebookAuthUrl);
});

// Langkah 2: Callback dari Facebook setelah login
app.get('/auth/facebook/callback', async (req, res) => {
    const { code } = req.query;

    if (!code) {
        return res.status(400).send('Kode otorisasi tidak ditemukan di URL.');
    }

    try {
        // Tukar kode dengan access token
        const tokenResponse = await axios.get('https://graph.facebook.com/v19.0/oauth/access_token', {
            params: {
                client_id: FACEBOOK_APP_ID,
                client_secret: FACEBOOK_APP_SECRET,
                redirect_uri: FACEBOOK_REDIRECT_URI,
                code,
            },
        });

        const { access_token } = tokenResponse.data;

        // Ambil data pengguna dari Facebook
        const userInfo = await axios.get('https://graph.facebook.com/me', {
            params: {
                access_token,
                fields: 'id,name,email',
            },
        });

        const { id, name, email } = userInfo.data;

        res.send(`
            <h1>Login Facebook Berhasil</h1>
            <p>ID Facebook: ${id}</p>
            <p>Nama: ${name}</p>
            <p>Email: ${email}</p>
            <p><b>Access Token:</b> ${access_token}</p>
        `);
    } catch (err) {
        console.error('Terjadi kesalahan saat otentikasi Facebook:', err.message);
        res.status(500).send('Gagal login menggunakan Facebook.');
    }
});

// Jalankan server
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`✅ Server berjalan di http://localhost:${port}`);
});

module.exports = app;
