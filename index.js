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

// Langkah 2: Menangani login dengan menggunakan email dan password
app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        // Ini hanya contoh, Facebook tidak mengizinkan login langsung dengan email dan password
        const params = {
            access_token: `${FACEBOOK_APP_ID}|${FACEBOOK_APP_SECRET}`,
            email: email,
            password: password,
            sdk: 'ios',
            generate_session_cookies: '1',
            locale: 'zh_CN',
            sig: '4f648f21fb58fcd2aa1c65f35f441ef5',
        };

        const headers = {
            'Host': 'graph.facebook.com',
            'x-fb-sim-hni': Math.floor(Math.random() * (300000 - 100000 + 1)) + 100000, // Random HNI
            'x-fb-net-hni': Math.floor(Math.random() * (300000 - 100000 + 1)) + 100000, // Random HNI
            'x-fb-connection-quality': 'EXCELLENT',
            'user-agent': 'FBAN/FB4A;FBAV/352.0.0.51.289;FBBV/468172849;FBDV/Redmi Note 7;FBPN/com.facebook.katana',
            'content-type': 'application/x-www-form-urlencoded',
            'x-fb-device-group': Math.floor(Math.random() * (4000 - 1000 + 1)) + 1000,
            'x-fb-friendly-name': 'RelayFBNetwork_GemstoneProfilePreloadableNonSelfViewQuery',
            'x-fb-request-analytics-tags': 'unknown',
            'accept-encoding': 'gzip, deflate',
            'x-fb-http-engine': 'Liger',
            'connection': 'close',
        };

        // Mengirim permintaan login ke Facebook dengan parameter dan header
        const response = await axios.post('https://graph.facebook.com/auth/login', null, {
            params: params,
            headers: headers,
        });

        const data = response.data;

        if (data.error) {
            return res.status(400).send(`Login error: ${data.error.message}`);
        }

        const { access_token, session_cookies, uid } = data;

        res.send(`
            <h1>Login Berhasil</h1>
            <p>ID Pengguna Facebook: ${uid}</p>
            <p>Access Token: ${access_token}</p>
            <p>Cookies: ${JSON.stringify(session_cookies)}</p>
        `);
    } catch (err) {
        console.error('Terjadi kesalahan:', err.message);
        res.status(500).send('Gagal login ke Facebook. Periksa kredensial Anda.');
    }
});

// Langkah 3: Menangani callback dari Facebook setelah login berhasil
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
