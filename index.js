const express = require('express');
const axios = require('axios');
const bcrypt = require('bcryptjs');
const bodyParser = require('body-parser');
const app = express();

const FACEBOOK_APP_ID = '200424423651082';
const FACEBOOK_APP_SECRET = '2a9918c6bcd75b94cefcbb5635c6ad16';
const FACEBOOK_REDIRECT_URI = 'https://callbackmain.vercel.app/auth/facebook/callback';

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Penyimpanan user sementara (pakai database sesungguhnya di produksi)
const users = [];

// Halaman utama
app.get('/', (req, res) => {
    res.send(`
        <h1>Login Manual / Facebook</h1>

        <h3>Daftar Akun Baru</h3>
        <form action="/register" method="POST">
            <input type="text" name="email" placeholder="Email" required><br>
            <input type="password" name="password" placeholder="Password" required><br>
            <button type="submit">Daftar</button>
        </form>

        <h3>Login Manual</h3>
        <form action="/login" method="POST">
            <input type="text" name="email" placeholder="Email" required><br>
            <input type="password" name="password" placeholder="Password" required><br>
            <button type="submit">Login</button>
        </form>

        <h3>Atau</h3>
        <a href="/login/facebook">Login dengan Facebook</a>
    `);
});

// ✅ Route untuk registrasi
app.post('/register', async (req, res) => {
    const { email, password } = req.body;
    const existingUser = users.find(u => u.email === email);
    if (existingUser) {
        return res.send('Email sudah terdaftar!');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    users.push({ email, password: hashedPassword });
    res.send('Pendaftaran berhasil! Silakan login.');
});

// ✅ Route untuk login asli
app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const user = users.find(u => u.email === email);
    if (!user) {
        return res.send('Email tidak ditemukan.');
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
        return res.send('Password salah.');
    }

    res.send(`
        <h2>Login Berhasil</h2>
        <p>Selamat datang, ${email}!</p>
    `);
});

// Login Facebook - langkah 1
app.get('/login/facebook', (req, res) => {
    const facebookAuthUrl = `https://www.facebook.com/v15.0/dialog/oauth?client_id=${FACEBOOK_APP_ID}&redirect_uri=${FACEBOOK_REDIRECT_URI}&scope=email,public_profile`;
    res.redirect(facebookAuthUrl);
});

// Callback dari Facebook - langkah 2
app.get('/auth/facebook/callback', async (req, res) => {
    const { code } = req.query;

    if (!code) {
        return res.status(400).send('Kode otorisasi tidak ada');
    }

    try {
        const response = await axios.get('https://graph.facebook.com/v15.0/oauth/access_token', {
            params: {
                client_id: FACEBOOK_APP_ID,
                client_secret: FACEBOOK_APP_SECRET,
                redirect_uri: FACEBOOK_REDIRECT_URI,
                code,
            },
        });

        const { access_token } = response.data;

        const userInfo = await axios.get('https://graph.facebook.com/me', {
            params: {
                access_token,
                fields: 'id,name,email',
            },
        });

        res.send(`
            <h1>Login Facebook Berhasil</h1>
            <p>ID Facebook: ${userInfo.data.id}</p>
            <p>Nama: ${userInfo.data.name}</p>
            <p>Email: ${userInfo.data.email}</p>
            <p>Access Token: ${access_token}</p>
        `);
    } catch (err) {
        console.error('Terjadi kesalahan saat login Facebook:', err.message);
        res.status(500).send('Gagal login menggunakan Facebook.');
    }
});

// Jalankan server
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`✅ Server berjalan di http://localhost:${port}`);
});

module.exports = app;
