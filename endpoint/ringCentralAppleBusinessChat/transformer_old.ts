createWebhookTransformer({

	/**
	 * Converts the contents of the Webchat tab
	 * in a Say Node to the corresponding Smooch
	 * template.
	 */
	handleOutput: async ({ output, processedOutput }) => {
		const { data } = output;

		console.log("FOUND THE FOLLOWING OBJECT");
		console.log(JSON.stringify(data));

		const { _cognigy } = data;

		console.log("TRANSFORMER TRIGGERED!");
		/**
		 * If there is no webchat
		 * data to convert,
		 * return the already
		 * procesed output
		 */

		let body: any;
		let transformedData: any;


		// if (!_webchat) {
		// 	return processedOutput;
		// }





		/**
		 * Conver the Webchat data to the correct
		 * Smooch template based on the found
		 * Webchat template 
		 */
		console.log("CHECKING WEBCHAT PRESENCE");

		if (_cognigy) {

			if (_cognigy["_webchat"]) {
				const { _webchat } = _cognigy;
				console.log("DETECTED WEBCHAT PRESENCE");

				const { message } = _webchat;
				if (message["quick_replies"]) {
					console.log("FOUND QUICK REPLIES: TRANSFORMING TO ABC");

					body = message.text;
					let items = [];
					message["quick_replies"].forEach((reply) => {
						items.push({
							"title": reply.title,
							"payload": reply.payload
						})
					})

					transformedData = {
						"attachment_id": "5e5e5fe1dbddbb73d01d9c80",
						"type": "select",
						"subtitle": "Make a selection:",
						"center_items": true,
						"disable_text_input": false,
						"items": items
					}

				} else if (message.attachment) {

					if (message.attachment && message.attachment["type"] === "template" && (message.attachment.payload["template_type"] === "list")) {

						console.log("FOUND LIST")
						transformedData = {
							"type": "rich_link",
							"attachment_id": "5e5e5fe1dbddbb73d01d9c80",
							"title": "Website:",
							"subtitle": "More info",
							"url": message.attachment.payload.url,
							"url_text": "Link"
						}

					} else if (message.attachment && message.attachment.payload && (message.attachment.payload["template_type"] === "generic")) {
						console.log("FOUND A GALLERY => MAPPING TO ABC")

						let items = [];
						let sections = [];
						body = "Please make a selection";

						message.attachment.payload.elements.forEach((reply, i) => {
							items.push({
								"section_identifier": i,
								"title": reply.title,
								"subtitle": "Choose",
								"attachment_id": reply.subtitle,
								"payload": reply.title
							})
						})

						message.attachment.payload.elements.forEach((section, j)=> {
							sections.push({
								"title": section.title,
								"multiple_selection": false,
								"identifier": j
							})
						})

						// transformedData = {
						// 	"attachment_id": message.attachment.payload.elements[0].subtitle,
						// 	"type": "select",
						// 	"subtitle": "Make a selection:",
						// 	"center_items": true,
						// 	"disable_text_input": false,
						// 	"items": items
						// }

						transformedData = {
								"type": "select",
								"subtitle": "Quick Replies",
								"attachment_id": "5e5fc9f1dbddbb4dd892c198",
								"center_items": true,
								"disable_text_input": false,
								"sections": sections,
								"items": items
						}
						// let elements = [];

						// message.attachment.payload.elements.forEach((element) => {
						// 	elements.push(
						// 		{
						// 		"attachment_id": "5e5e56c35267226cdaf2ef3f",
						// 		"title": "Ringcentral, Inc.",
						// 		"subtitle": "Cloud Business Communications. RingCentral, Inc. has 84 repositories available.  Follow their code on GitHub.",
						// 		"items": [
						// 			{
						// 				"title": "Go to website",
						// 				"type": "url",
						// 				"url": "https://github.com/ringcentral"
						// 			}
						// 		]
						// 	})
						// })

						//

						// transformedData = {
						// 	"type": "template",
						// 	"attachment_id": "5e5e5fe1dbddbb73d01d9c80",
						// 	"title": "Ringcentral, Inc.",
						// 	"subtitle": "Cloud Business Communications. RingCentral, Inc. has 84 repositories  available. Follow their code on GitHub.",
						// 	"url": "​https: //github.com/ringcentral​",
						// 	"url_text": "Github",
						// 	"items": [
						// 		{
						// 			"title": "Go to website",
						// 			"type": "url",
						// 			"url": "​https://github.com/ringcentral​"
						// 		},
						// 		{
						// 			"title": "Ok",
						// 			"type": "reply"
						// 		},
						// 		{
						// 			"title": "Give me more",
						// 			"type": "reply",
						// 			"payload": "more"
						// 		}
						// 	]

						// }

						console.log(JSON.stringify(transformedData))

					}

				}
			}
		} else if (data["_plugin"] && (data["_plugin"].type === "date-picker")) {
			console.log("Found DATE PICKER")

			body = "Pick Your Date";
			transformedData = {
				"type": "time_select",
				"attachment_id": "5e5fc9f1dbddbb4dd892c198",
				"location": {
					"latitude": 48.874989,
					"longitude": 2.345589,
					"radius": 100,
					"title": "Dimelo"
				},
				"timeslots": [
					{
						"start_time": "2020-03-10T09:45-07:00",
						"identifier": "Time Slot A",
						"dulation": 3600
					},
					{
						"start_time": "2020-03-10T11:00-07:00",
						"identifier": "Time Slot B",
						"dulation": 3600
					},
					{
						"start_time": "2020-03-11T11:00-07:00",
						"identifier": "Time Slot C",
						"dulation": 3600
					},
					{
						"start_time": "2020-03-11T12:00-07:00",
						"identifier": "Time Slot D",
						"dulation": 3600
					},
					{
						"start_time": "2020-03-11T13:00-07:00",
						"identifier": "Time Slot E",
						"dulation": 3600
					},
					{
						"start_time": "2020-03-12T11:00-07:00",
						"identifier": "Time Slot C",
						"dulation": 3600
					},
					{
						"start_time": "2020-03-12T12:00-07:00",
						"identifier": "Time Slot D",
						"dulation": 3600
					},
					{
						"start_time": "2020-03-14T13:00-07:00",
						"identifier": "Time Slot E",
						"dulation": 3600
					}
				]
			}

		} else {
			console.log("Did not find specific output");
			console.log(output.text);
			//return processedOutput;
			body = output.text;
		}

		const requestPayload: any = {
			"body": body,
			"structured_content": transformedData
		}

		//return processedOutput;

		// return requestPayload;
		// const requestPayload: any = {
		// 	...transformedData
		// }

		console.log("Finally sending the following back to RCE")
		console.log(JSON.stringify(requestPayload));
		return requestPayload;
	}
});
