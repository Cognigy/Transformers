# Description
This Transformer example demonstrates how to connect a custom Endpoint to Cognigy.AI. This could for example be a new platform that Cognigy.AI doesn't suport natively yet, or a custom built Endpoint such as a custom Webchat. In this example, the Transformer connects to the platform Telegram.


# Usage
To use this Transformer, the first step is to create a Telegram Bot and copying the Bot Token into the TOKEN const in the ``transformer.ts`` file.

Afterwards, a Webhook Endpoint has to be created in Cognigy.AI, since Telegram offer a webhook based API. The contents of the ``transformer.ts`` file can then be copied into the created Webhook Endpoint, and the ``Output Transformer`` and ``Input Transformer`` has to be ``enabled``.