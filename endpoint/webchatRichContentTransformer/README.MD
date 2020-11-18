# Description
This Transformer example demonstrates how to transform the output of the Webchat tab in the Say Node Editor to another format for another channel. This has two main use-cases:

- It enables users to use the rich content editor that exists for e.g. the Webchat Endpoint to create content for another Endpoint.
- It enables users to add support for another Endpoint without duplicating the content in each Say Node.

This specific Transformer example converts the following Webchat templates into the format of a Sunshine Conversations Endpoint:

- Button template
- Gallery template
- List template
- Image template

# Usage
To use this Transformer, the first step is to create a Sunshine Conversations Endpoint in Cognigy.AI and connect it to a Sunshine Conversations app using the guide [here](https://docs.cognigy.com/docs/deploy-a-smooch-endpoint).

After creating the Sunshine Conversations Endpoint, the contents of the ``transformer.ts`` file have to be copied into the Transformer Function of the Endpoint. Afterwards, the ``Output Transformer`` has to be ``enabled``.

When the above steps have been completed, the Webchat tab in a Say Node can be used to create content for the Sunshine Conversations Endpoint.