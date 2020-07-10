// Place your Twilio Auth Token here
// https://support.twilio.com/hc/en-us/articles/223136027-Auth-Tokens-and-How-to-Change-Them
const AUTH_TOKEN = "Your Token";

/**
 * Creates Twilio Signature
 */
function getSignature(authToken, url, params) {
  // get all request parameters, sort and concatenate
  const data = Object.keys(params)
    .sort()
    .reduce((acc, key) => acc + key + params[key], url);

  // sign the string with sha1 using your AuthToken
  return crypto
    .createHmac('sha1', authToken)
	// @ts-ignore
    .update(Buffer.from(data, 'utf-8'))
    .digest('base64');
}

createRestTransformer({

	/**
	 * This transformer is executed when receiving a message
	 * from the user, before executing the Flow.
	 */
	handleInput: async ({ endpoint, request, response }) => {
		// Verify request is coming from Twilio
		if (request["headers"]["x-twilio-signature"] !== getSignature(AUTH_TOKEN, "https://endpoint-internal.cognigy.ai/849b07d8c92fa1107dfe7b27531a7acbd7f6fce441c3e758338c7581aa62436f", request.body)) {
			console.error("Received Invalid Request");
			response.status(401).send('Unauthorized');
			return null;
		}

		const userId = request.body.To;
		const sessionId = request.body.SmsMessageSid;
		const text = request.body.Body;
		const data = request.body;

		return {
			userId,
			sessionId,
			text,
			data
		};
	}
});