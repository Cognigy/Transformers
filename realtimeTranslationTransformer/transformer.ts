const SUBSCRIPTION_KEY = "<key>";

/**
 * The 'inp' key should be set to the
 * language of your Flow
 */
const CONFIG = {
	inp: "en",
	keysToTranslate: ["title", "subtitle", "payload", "text"]
}

createSocketTransformer({
	handleInput: async ({ payload }) => {
		const translateResult = await translate([{ "text": payload.text }], CONFIG.inp);
		const sstorage = await getSessionStorage(payload.userId, payload.sessionId);
		sstorage.lang = translateResult[0].detectedLanguage.language;

		const resultText = translateResult[0].translations[0].text;

		return {
			userId: payload.userId,
			sessionId: payload.sessionId,
			text: resultText
		};
	},

	handleOutput: async ({ processedOutput, userId, sessionId }) => {
		const sstorage = await getSessionStorage(userId, sessionId);

		if (sstorage.lang !== "en") {
			if (processedOutput.text) stringsToTranslate.push(processedOutput.text);
			if (processedOutput.data) {
				const moreStringsToTranslate = findStringsInObject(processedOutput.data);
				if(moreStringsToTranslate && Array.isArray(moreStringsToTranslate) && moreStringsToTranslate.length > 0) stringsToTranslate.concat(moreStringsToTranslate);
			}

			const translateObject = [];
			stringsToTranslate.forEach((s) => {
				translateObject.push({ "text": s });
			})
			
			const translatedStrings = await translate(translateObject, sstorage.lang);
			
			let stringObject = JSON.stringify(processedOutput);
			for(let i = 0; i<stringsToTranslate.length; i++){
				const inp = stringsToTranslate[i];
				const out = translatedStrings[i].translations[0].text;
				const rxp = new Regexp(inp, "g");
				stringObject = stringObject.replace(inp, out);
			}
			return JSON.parse(stringObject);
		} else return processedOutput;
	}
});

const translate = async (arr: Object[], to: string): Promise<any> => {
	if (!arr) return arr;
	let options = {
			method: 'POST',
			uri: 'https://api.cognitive.microsofttranslator.com/translate',
			qs: {
				'api-version': '3.0',
				'to': to
			},
			headers: {
				'Ocp-Apim-Subscription-Key': SUBSCRIPTION_KEY,
				'Content-type': 'application/json',
				'X-ClientTraceId': uuid.v4().toString()
			},
			body: arr,
			json: true
		};
		try {
			let result = await httpRequest(options);
			return result;
		} catch(err) {
			console.error(err.message);
			return null;
		}	
};

const stringsToTranslate = [];

const findStringsInObject = (obj) => {
    if (Array.isArray(obj)) {
        obj.forEach((a) => {
           findStringsInObject(a);     
        });
    } else {
        Object.keys(obj).forEach((k) => {
            if (obj[k]) {
				if (typeof obj[k] === "object") findStringsInObject(obj[k]);
				else {
					if (CONFIG.keysToTranslate.indexOf(k) > -1 ) stringsToTranslate.push(obj[k])
				}
			}
        })
    }

	return stringsToTranslate;
};
