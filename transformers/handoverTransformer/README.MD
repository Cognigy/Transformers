# Description
This Transformer example demonstrates how to build integration with an agent tool for live person handover. The Transformer works by tracking whether the user is in a handover state or not by storing a variable inside the ``Session Storage`` object, which is available throughout the session. The Transformer marks the user as being in a handover when it receives a specific data output in a Flow, enabling the Flow builder to decide when the user should be forwarded to a live agent.

This example includess a small example agent tool, which the transformer communicates with to start the handover and which will send replies as an agent.

# Usage
To use this Transformer, the first step is to create a Webchat Endpoint in Cognigy.AI and copying the contents of the ``transformer.ts`` file into the Transformer function.

The next step is to start the example server that the Transformer communicates with. To do this, having Node.JS installed is a requirement. Before starting the server, the environment variable BASE_ENDPOINT_URL has to be set to the value of the Endpoint URL of the target Cognigy.AI installation, e.g. https://endpoint-demo.cognigy.ai. The server can then be started using the command:

```bash
node server.js
```

When the server has started, it will per default listen to requests on port 8000. In order to connect the server to the Transformer, a tool like NGROK is required to make the server available through the internet. The ``handoverProviderURL`` variable in the top of the Transformer has to be replaced with the URL to the server.

When everything is setup, a handover can be triggered by adding the following object to the data field of a Say Node in a Flow:

```JSON
{
    "startHandover": true
}
```

Sending this data payload from the Flow will cause all messages from the user to be forwarded to the handover example server, which will send a default agent reply. The user can stop the handover by saying ``bot``, which will cause a message with the following payload to be sent to the Flow:

```JSON
{
    "endHandover": true
}
```