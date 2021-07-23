// Microsoft Cognitive Services API Key for Spell Check
// API Docs: https://docs.microsoft.com/de-de/azure/cognitive-services/bing-spell-check/quickstarts/nodejs
const API_KEY: string = "";


createNluTransformer({
	preNlu: async ({ text, data, language }) => {

		const requestBody = {
			'uri': `https://api.cognitive.microsoft.com/bing/v7.0/spellcheck?mkt=${language}&mode=proof&text=${text}`,
			'method': "GET",
			'headers': {
				'Accept': 'application/json',
				'Ocp-Apim-Subscription-Key': API_KEY,
				'Content-Type': 'application/x-www-form-urlencoded'
			},
			json: true
		}

		try {
			const result = await httpRequest(requestBody);

			// Check if a spelling suggestion is provided in the result object
			if (result?.flaggedTokens[0]?.suggestions) {
				// Overwrite the initial user text with the first found suggestion
				const suggestion = result.flaggedTokens[0].suggestions[0].suggestion;
				// Store the detailed result in input.data
				data["spellcheck"] = result.flaggedTokens;

				return {
					text: suggestion,
					data
				};
			}
		} catch (error) {
			console.error(error)
		}

		return {
			text,
			data
		};
	}
});