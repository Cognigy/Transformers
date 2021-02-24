# Description
This Transformer example demonstrates how to build an endpoint for LiveChat Inc's (https://www.livechatinc.com) live chat tool, including formatting of messages and handover to a human.

# Usage
To use this Transformer, the first step is to create a REST Endpoint in Cognigy.AI and copying the contents of the ``transformer.ts`` file into the Transformer function.

The Endpoint transformers messages composed in Cognigy.AI's webchat view automatically to LiveChat's format.

To trigger a handover, send a data message like this:
```JSON
{
    "handover": true
}
```

# Tutorial
To learn how to set up LiveChat and Cognigy.AI to work together using this transformer, refer to this blog post: https://medium.com/cognigyai/connecting-livechat-to-cognigy-ai-enterprise-virtual-agents-using-endpoint-transformers-a4e74d18bc84