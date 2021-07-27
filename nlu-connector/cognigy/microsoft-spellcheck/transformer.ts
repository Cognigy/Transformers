// Microsoft Cognitive Services API Key for Spell Check
// API Docs: https://docs.microsoft.com/de-de/azure/cognitive-services/bing-spell-check/quickstarts/nodejs
const API_KEY: string = "";

// Score threshold
// A number between 0 and 1.
const THRESHOLD: number = 0.7;

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
			if (
				result?.flaggedTokens[0]?.suggestions
				&&
				result?.flaggedTokens[0]?.suggestions[0]?.score >= THRESHOLD
			) {

				let suggestedText: string = text;

				// Loop through the suggested results and change the initial text
				for (let suggestionResult of result.flaggedTokens) {
					suggestedText = suggestedText.replace(suggestionResult.token, suggestionResult.suggestions[0].suggestion);
				}

				// Store the detailed result in input.data.spellcheck
				data["spellcheck"] = result;
				// Store the initial user text in input.data.spellcheck.initialText
				data["spellcheck"]["initialText"] = text;

				return {
					text: suggestedText,
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