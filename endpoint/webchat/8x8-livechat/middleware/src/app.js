const express = require('express');
const axios = require('axios');

const app = express();
const port = 8181;

// Enable JSON Body
app.use(express.json({ type: () => true }));

app.post('/inject/:region/tenant/:tenantId', async (req, res) => {

    const { body, params } = req;
    const { region, tenantId } = params;

    // Check if the Webhook must be validated by the 8x8 platform for configuration
    // Sent body: {"notificationVersion":"v2.0","eventType":"WEB_HOOK_VERIFY"}
    if (req?.body?.eventType === 'WEB_HOOK_VERIFY') {
        res.sendStatus(200);
    }

    try {

        // Get the conversation details
        const conversationDetailsResponse = await axios({
            method: 'get',
            url: `https://api.8x8.com/vcc/${region}/chat/v2/tenant/${tenantId}/conversations/${body?.conversationId}`,
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer zZSAmQIn5AYmJ7GvuXRb4Rr2Xvo3`
            }
        });

        const { customer } = conversationDetailsResponse?.data;
        const { cognigySessionId, cognigyURLToken, cognigyUserId } = customer;

        // Check if the agent sent a message or a different event happened
        if (body?.eventType === 'TEXT') {
            await axios({
                method: 'post',
                url: `https://endpoint-trial.cognigy.ai/notify/${cognigyURLToken}`,
                data: {
                    userId: cognigyUserId,
                    text: body?.message,
                    data: null,
                    sessionId: cognigySessionId
                }
            });
        } else {
            await axios({
                method: 'post',
                url: `https://endpoint-trial.cognigy.ai/inject/${cognigyURLToken}`,
                data: {
                    userId: cognigyUserId,
                    text: '',
                    data: body,
                    sessionId: cognigySessionId
                }
            });
        }

        if (!res.headersSent) {
            res.status(200).send("");
        }
    } catch (error) {
        res.send(error);
        console.log(error.message)
    }
});

// start the express server
app.listen(port, () => {
    console.log(`[8x8 Live Chat Message Server] started at port ${port}`);
});