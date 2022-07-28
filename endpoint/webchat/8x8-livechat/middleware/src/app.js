const express = require('express');
const axios = require('axios');

const app = express();
const port = 8181;

// Enable JSON Body
app.use(express.json({ type: () => true }));

app.post('/inject', async (req, res) => {

    const { body } = req;

    try {
        await axios({
            method: "post",
            url: `${cogEndpointUrl}/inject/${URLToken}`,
            data: {
                userId,
                text: "",
                data: body,
                sessionId
            }
        });

        if (!res.headersSent) {
            res.status(200).send("");
        }
    } catch (error) {
        res.send(error)
    }
});

// start the express server
app.listen(port, () => {
    console.log(`[8x8 Live Chat Message Server] started at port ${port}`);
});