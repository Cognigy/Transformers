# Telegram

With this transformer function, a Cognigy.AI virtual agent can be connected the [Telegram Messenger](https://telegram.org).

<img src="./telegram.svg" width="200">

**Message Types:**

- Text
- Audio
  - *Needs to be a URL to a .mp3 file*
- Image
- Video
  - *Needs to be a URL to a .mp4 file*

## Set Up

In order to establish this connection, Telegram and Cognigy.AI need to be configured first.

### Cognigy.AI

On the Cognigy.AI side, the following steps need to be done:

1. Login to [Cognigy.AI](https://trial.cognigy.ai)
2. Create a new virtual agent
3. Navigate to <code>Deploy -> Endpoints</code> and create a new [Webhook Endpoint](https://docs.cognigy.com/docs/webhook)
4. Open the **Transformer Functions** section and enable:
   1. *Abort on Error in Transformer*
   2. *Enable Input Transformer*
   3. *Enable Output Transformer*
   4. *Enable Execution Finished Transformer*
5. Copy the source code from the [Transformer Code File](./transformer.ts) and paste it into the code field in Cogngiy.AI

### Telegram

Since the virtual agent is now able to handle Telegram messages, a so-called **Telegram Bot** needs to be configured and, last but not least, connected to the Cognigy.AI Webhook Endpoint URL.

1. [Create a new Application](https://core.telegram.org/api/obtaining_api_id)
2. [Register a Telegram Bot (Bot Father)](https://core.telegram.org/bots#3-how-do-i-create-a-bot)
3. [Set the Cognigy.AI Webhook Endpoint URL](https://core.telegram.org/bots/api#setwebhook)