const express = require('express');
const axios = require('axios');
const app = express();
const port = process.env.PORT || 3000;

app.get('/callback', async (req, res) => {
    const { access_token, error } = req.query;

    if (error) {
        return res.status(400).send('Error occurred: ' + error);
    }

    if (!access_token) {
        return res.status(400).send('Access token not found.');
    }

    try {
        // Memanggil Facebook Graph API untuk mendapatkan data pengguna
        const response = await axios.get(`https://graph.facebook.com/me?access_token=${access_token}&fields=id,name,email`);
        const userData = response.data;

        res.send(`<h1>Welcome, ${userData.name}</h1><p>Your email: ${userData.email}</p>`);
    } catch (err) {
        console.error('Error fetching data from Facebook API', err);
        res.status(500).send('Error fetching data from Facebook API');
    }
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
