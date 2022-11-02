# Instagram
This Enpoint Transformer provides a native integration with Instagram.

# Message Types

- Text
- Text with Quick Replies
- Image
- Video
- Audio
- Galleries

# How to Setup

1. In order to create the required **Facebook Developer** Account and connect it to your instagram page, please read the official documentation here: https://developers.facebook.com/docs/messenger-platform/instagram/get-started

<img src="./docs/facebookForDevelopers.png" width="800" />
2. Insert the Webhook URL from the Cognigy.AI Endpoint as "Webhook Callback-URL"
3. Define a `VERIFY_TOKEN` in the transformer.ts and insert the same value in the "Verification Token" field.
4. Find your the page ID for your Instagram webpage and add it to the `PAGE_ID` field.  
5. Create an access token in the developer portal and add it to the `ACCESS_TOKEN` field
