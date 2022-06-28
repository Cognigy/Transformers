# Zoom

<img src="./docs/zoom.svg" width="10%">

This [Transformer Function](https://docs.cognigy.com/docs/transformers) converts the Default content of your [Say Node](https://docs.cognigy.com/docs/say-nodes) to valid [Zoom](https://www.zoom.us/) chat messages.

## Supported message types

- Text
- Text with Quick Replies
- Image

## Installation

Before this Transformer can be used in a **Webhook Endpoint** within a Cognigy.AI Virtual Agent, a so-called "Chatbot App" must be registered in the Zoom Developer Portal. In order to do so, please follow the official documentation: https://marketplace.zoom.us/docs/guides/build/chatbot-app

### Local Testing

Since the functionality of the newly created "Chatbot App" should be tested before publishing it for the whole organization, please take a look into the "Local Testing" documentation: https://marketplace.zoom.us/docs/guides/build/chatbot-app#local-testing.

**Setup the Endpoint Transformer:**

1. In [Cognigy.AI](https://trial.cognigy.ai), (optional: create a new Virtual Agent and) navigate to Deploy -> Endpoints
2. Create a new Endpoint of type "Webhook". You can call it "Zoom"
3. Inside of the Endpoint details page, search for the section called "Transformer Functions"
4. Click on the "Enable Input Transformer" and "Enable Output Transformer" toggle button
5. Copy the Transformer code from the [transformer.ts](./transformer.ts) file
6. Replace the whole existing code of the "Transformer" in the Webhook Endpoint with the recently copied one
7. Inside of the Zoom Developer Portal, navigate to the "App Credentials" section and copy the "Client ID" and "Client secret" value
8. Inside of the new code, search for the values <code>CLIENT_ID</code> and <code>CLIENT_SECRET</code> and insert the previously copied values
9. Click "Save" at the bottom of the screen

**Setup the Zoom Chatbot App:**

1. Copy your "Bot JID [development]" that can be found in the "Features" section of your Zoom Chatbot App
2. Insert this "Bot JID [development]" to the [/auth-callback.html](./marketplace//auth-callback.html) (./marketplace/auth-callback.html)
3. Expose the [/auth-callback.html](./marketplace//auth-callback.html) (./marketplace/auth-callback.html) to your http://localhost and insert this URL as "Redirect URL" in the "App Credentials" section of the Zoom Chatbot App: https://marketplace.zoom.us/docs/guides/build/chatbot-app/#generate-app-credentials
4. Inside of the "Local Test" section of your Zoom Chatbot App, click on the "Add" button.
5. This will redirect you to the authentication page of Zoom that asks for the permission to install the app.
6. Afterward, the redirect URL will be called while your Zoom client should open a new chat with zour Zoom Chatbot App as result.

