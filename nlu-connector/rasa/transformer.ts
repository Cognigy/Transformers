/*
 * This Transformer connects to a Rasa server
 * The Rasa server needs to be running with the --enable-api flag set
 */

// the Rasa server url
const baseUrl = 'INSERT URL'

createNluCodeTransformer({

	/**
	 * This transformer with a custom NLU pipline is executed when
	 * receiving a message from the endpoint, before executing the Flow.
	 * @param text The text from the message.
	 * @param data The data object from the message.
	 * @param language The language code from the Flow.
	 *
	 * @returns nluResult and/or data, as changed in the transformer.
	 */
	getNluResult: async ({ text, data, language }) => {
		const requestBody = {
			'uri': baseUrl + '/model/parse',
			'method': "POST",
			'headers' : {
				'Content-Type':'application/json',
				'Accept':'application/json'
			},
			'body': {
				'text':text
			},
			'json': true
		}
		let result = null
		//send to Rasa
		try {
			//@ts-ignore
			result = await httpRequest(requestBody); 
		} catch (error){
			console.error(error)
		}

		let nluResult = {
			intent: null,
			type: null,
			slots: {},
			intentScore: 0
		};
		
		data = {"payload": data}
		
		if (result?.intent) {
			nluResult.intent = result.intent.name
			nluResult.intentScore = result.intent.confidence
			if (result.entities.length) {
				nluResult.slots["rasa"] = result.entities
			}
			data["rasa"] = result
		}

		return {
			data,
			nluResult
		}
	}
});