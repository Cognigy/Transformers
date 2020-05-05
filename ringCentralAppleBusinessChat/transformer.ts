/*
* Add the attachment id of your global image which should be used in the messages.
* How to get an attachment id:
*  - https://grokify.github.io/go-ringcentral-engage/#tag/Attachments
*/
const ATTACHMENT_ID = "";

/**
 * Configure the text information globally in the LOCALIZATION object
 */
const LOCALIZATION = {
	SELECT: {
		SUBTITLE: 'Make a selection:',
		BODY: 'Please make a selection'
	},
	RICH_LINK: {
		TITLE: 'Website:',
		SUBTITLE: 'More info',
		URL_TEXT: 'Link'
	},
	DATEPICKER: {
		BODY: 'Select a date',
		PICKER: {
			LOCATION_TITLE: 'Title'
		}
	}
}

/**
 * Webchat Interface
 */
interface IWebchatQuickReply {
	content_type: string;
	title: string;
	image_url: string;
	payload: string;
}

/**
 * Todo: Add comments to interfaces
 */
interface IWebchatListElement {
	title: string;
	subtitle: string;
	image_url: string;
	buttons: IWebchatButton[];
}

interface IWebchatButton {
	title?: string;
	type: string;
	url?: string;
	payload?: string;
	messenger_extensions?: boolean;
	webview_height_ratio?: string;
}

interface IWebchatTextContent {
	message: {
		text: string;
	}
}

interface IWebchatQuickRepliesContent {
	message: {
		text: string;
		quick_replies: IWebchatQuickReply[];
	}
}

interface IWebchatAttachmentContent {
	message: {
		attachment: {
			type: 'template' | 'image' | 'video' | 'audio',
			payload: IWebchatListPayload | IWebchatGalleryPayload | IWebchatButtonsPayload | IWebchatMediaPayload
		}
	}
}

interface IWebchatListPayload {
	template_type: 'list';
	top_element_style: string;
	elements: IWebchatListElement[];
	buttons: IWebchatButton[];

}

interface IWebchatGalleryPayload {
	template_type: 'generic';
	elements: IWebchatListElement[]
}

interface IWebchatButtonsPayload {
	template_type: 'button';
	text: string;
	buttons: IWebchatButton[];
}

interface IWebchatMediaPayload {
	url: string
}

type TWebchatContent = IWebchatTextContent | IWebchatQuickRepliesContent | IWebchatAttachmentContent;

/**
 * RingCentral Apple Business Chat Interface
 */
interface IABCContent {
	body: string;
	structured_content?: IABCStructuredContentDatePicker | IABCStructuredContentSelections | IABCStructuredContentRichLink;
}

interface IABCStructuredContentSelections {
	attachment_id: string;
	type: 'select';
	subtitle: string;
	center_items: boolean;
	disable_text_input: boolean;
	items: IABCStructuredContentSelection[];
	sections?: IABCStructuredContentSection[];
}

interface IABCStructuredContentRichLink {
	type: 'rich_link';
	attachment_id: string;
	title: string;
	subtitle?: string;
	url: string;
	url_text?: string;
}

interface IABCStructuredContentSection {
	title: string;
	multiple_selection: boolean;
	identifier: number;
}

interface IABCStructuredContentGalleryItem {
	section_identifier: number;
	title: string;
	subtitle: string;
	attachment_id: string;
	payload: string;
}

interface IABCStructuredContentSelection {
	title: string;
	payload: string;
}

interface IABCStructuredContentDatePicker {
	type: 'time_select';
	attachment_id: string;
	location: {
		latitude: number;
		longitude: number;
		radius: number,
		title: string
	},
	timeslots: IABCStructuredContentDatePickerTimeSlot[]
}

interface IABCStructuredContentDatePickerTimeSlot {
	start_time: string,
	identifier: string,
	duration: number
}

/**
 * Crate ABC mapped gallery from webchat gallery
 * @param items webchat list items
 */
const createGalleryItems = (items: IWebchatListElement[]):IABCStructuredContentGalleryItem[] => {

	let abcGalleryItems: IABCStructuredContentGalleryItem[] = [];

	for (let item of items) {
		abcGalleryItems.push(
			{
				attachment_id: '',
				payload: item.title,
				subtitle: item.subtitle,
				section_identifier: items.indexOf(item),
				title: item.title
			}
		);
	}

	return abcGalleryItems;
}

/**
 * Create ABC quick replies from webchat
 * @param quickReplies webchat quick replies
 */
const createSelections = (quickReplies: IWebchatQuickReply[]): IABCStructuredContentSelection[] => {

	let abcSelections: IABCStructuredContentSelection[] = [];

	for (let quickReply of quickReplies) {
		abcSelections.push(
			{
				title: quickReply.title,
				payload: quickReply.payload
				// imageUrl? 
			}
		);
	}

	return abcSelections;
}

/**
 * Create ABC sections from webchat list elements
 * @param elements webchat list elements in gallery
 */
const createSections = (elements: IWebchatListElement[]): IABCStructuredContentSection[] => {

	let abcsections: IABCStructuredContentSection[] = [];

	for (let element of elements) {
		abcsections.push(
			{
				title: element.title,
				multiple_selection: false,
				identifier: elements.indexOf(element)
			}
		)
	}

	return abcsections;
}

/**
 * Create a date picker list view based on the cognigy list
 * @param items webchat list items
 */
const createDatePickerTimeSlot = (items: IWebchatListElement[]): IABCStructuredContentDatePickerTimeSlot[] => {

	let abcTimeSlots: IABCStructuredContentDatePickerTimeSlot[] = [];

	for (let item of items) {
		abcTimeSlots.push(
			{
				duration: 3600,
				identifier: item.subtitle,
				start_time: item.title
			}
		);
	}
	return abcTimeSlots;
}

/**
 * Create a ABC time select view
 */
const createDatePicker = (listElements: IWebchatListElement[]): IABCStructuredContentDatePicker => {

	return {
		type: "time_select",
		attachment_id: ATTACHMENT_ID,
		location: {
			latitude: 48.874989,
			longitude: 2.345589,
			radius: 100,
			title: LOCALIZATION.DATEPICKER.PICKER.LOCATION_TITLE
		},
		timeslots: createDatePickerTimeSlot(listElements)
	}
}


const convertWebchatContentToAppleBusinessChat = (output): IABCContent => {
	const { data } = output;
	const { _cognigy } = data;

	if (_cognigy) {
		// check for webchat channel messages
		if (_cognigy._webchat) {
			const { _webchat } = _cognigy;
			const { message } = _webchat;

			// check for quick replies
			if (message.quick_replies) {

				return {
					body: message.text,
					structured_content: {
						attachment_id: ATTACHMENT_ID,
						type: "select",
						subtitle: LOCALIZATION.SELECT.SUBTITLE,
						center_items: true,
						disable_text_input: false,
						items: createSelections(message.quick_replies)
					}
				}

			} else if (message.attachment) {

				// check for list
				if (message.attachment && message.attachment.type === "template" && (message.attachment.payload.template_type === "list")) {

					/**
					 * Use a SAY Node data message to call the 'datepicker'. Parallely, the same SAY Node has to provide the webchat tab with a list view.
					 */
					if (output.data.type === 'datepicker') {
						return {
							body: LOCALIZATION.DATEPICKER.BODY,
							structured_content: createDatePicker(message.attachment.payload.elements)
						}
					}

					return {
						body: '',
						structured_content: {
							type: "rich_link",
							attachment_id: ATTACHMENT_ID,
							title: LOCALIZATION.RICH_LINK.TITLE,
							subtitle: LOCALIZATION.RICH_LINK.SUBTITLE,
							url: message.attachment.payload.url,
							url_text: LOCALIZATION.RICH_LINK.URL_TEXT
						}
					}

				// check for gallery
				} else if (message.attachment && message.attachment.payload && (message.attachment.payload.template_type === "generic")) {

					// check if there is only one gallery element
					if (message.attachment.payload.elements.length === 1) {

						/**
						 * Use a single Gallery element in the SAY Node to render a rich link attachment, such as an image with link.
						 */
						
						// return rich link structured messasge
						return {
							body: '',
							structured_content: {
								title: message.attachment.payload.elements[0].title,
								type: 'rich_link',
								attachment_id: ATTACHMENT_ID,
								url: message.attachment.payload.elements[0].url
							}
						}
					}

					// else return mapped gallery for ABC
					return {
						body: LOCALIZATION.SELECT.BODY,
						structured_content: {
							type: "select",
							subtitle: LOCALIZATION.SELECT.SUBTITLE,
							attachment_id: ATTACHMENT_ID,
							center_items: true,
							disable_text_input: false,
							sections: createSections(message.attachment.payload.elements),
							items: createGalleryItems( message.attachment.payload.elements)
						}
					}
				}

			}
		}
	// if there is no specific webchat channel content, return the default text
	} else {
		return {
			body: output.text
		}
	}
};

createWebhookTransformer({

	handleOutput: async ({ output, processedOutput }) => {

		// convert the webchat output to ringcentral apple business chat content. 
		// return plain text if the default tab was used.
		return convertWebchatContentToAppleBusinessChat(output);
	}
});
