const express = require('express');
const axios = require('axios');
const app = express();

const lambdaUrl = 'https://guxj9q9lk6.execute-api.us-east-2.amazonaws.com/say';  

app.get('/say', async (req, res) => {
    const keyword = req.query.keyword;
    if (!keyword) {
        return res.status(400).send('Keyword query parameter is required');
    }
    try {
        const response = await axios.get(`${lambdaUrl}?keyword=${keyword}`);
        res.send(response.data);
    } catch (error) {
        res.status(500).send('Error communicating with Lambda');
    }
});

app.listen(3000, () => {
    console.log('Server running on port 3000');
});
