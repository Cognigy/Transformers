const express = require("express");
const requestPromise = require("request-promise");

const endpointUrl = process.env.BASE_ENDPOINT_URL;

if (!endpointUrl) {
    console.error("Unable to start handover server. The environment variable BASE_ENDPOINT_URL has to be set");
    process.exit();
}

const port = parseInt(process.env.PORT) || 8000;

const app = express();

app.use(express.json());


app.post("/message", async (request, response) => {
    const { text: userMessage, URLToken, userId, sessionId } = request.body;

    const agentReply = `This is a reply from the agent. You said: ${userMessage}`;

    await sendAgentReply({ type: "message", message: agentReply, userId, sessionId }, URLToken);

    response.status(200).send();
});

app.post("/start", async (request, response) => {
    const { URLToken, userId, sessionId } = request.body;

    const agentReply = "Hi, I'm your agent, John. How may I help you today?";

    await sendAgentReply({ type: "message", message: agentReply, userId, sessionId }, URLToken);

    response.status(200).send();
});

app.post("/end", async (request, response) => {
    const { URLToken, userId, sessionId } = request.body;

    const agentReply = `I will now close the conversation and hand you back to the bot.`;

    await sendAgentReply({ type: "message", message: agentReply, userId, sessionId }, URLToken);

    response.status(200).send();
});

async function sendAgentReply(message, URLToken) {
    await new Promise(resolve => setTimeout(resolve, 1000));

    try {
        await requestPromise.post(`${endpointUrl}/notify/${URLToken}`, {
            body: message,
            json: true
        });
    } catch (err) {
        console.log(err);
    }   
}

app.listen(port, () => {
    console.log(`Server listening on port: ${port}`);
})