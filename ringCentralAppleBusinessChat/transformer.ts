/**
 * Webchat Interface
 */
interface IWebchatQuickReply {
    content_type: string;
    title: string;
    image_url: string;
    payload: string;
}

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
    structured_content: IABCStructuredContentDatePicker | IABCStructuredContentSelections | IABCStructuredContentRichLink;
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
    dulation: number
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
                attachment_id: item.subtitle,
                payload: item.title,
                subtitle: 'Choose',
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

const createDatePicker = (): IABCStructuredContentDatePicker => {
    return {
        type: "time_select",
        attachment_id: "5e5fc9f1dbddbb4dd892c198",
        location: {
            latitude: 48.874989,
            longitude: 2.345589,
            radius: 100,
            title: "Title"
        },
        timeslots: [
            {
                start_time: "2020-03-10T09:45-07:00",
                identifier: "Time Slot A",
                dulation: 3600
            },
            {
                start_time: "2020-03-10T11:00-07:00",
                identifier: "Time Slot B",
                dulation: 3600
            },
            {
                start_time: "2020-03-11T11:00-07:00",
                identifier: "Time Slot C",
                dulation: 3600
            },
            {
                start_time: "2020-03-11T12:00-07:00",
                identifier: "Time Slot D",
                dulation: 3600
            },
            {
                start_time: "2020-03-11T13:00-07:00",
                identifier: "Time Slot E",
                dulation: 3600
            },
            {
                start_time: "2020-03-12T11:00-07:00",
                identifier: "Time Slot C",
                dulation: 3600
            },
            {
                start_time: "2020-03-12T12:00-07:00",
                identifier: "Time Slot D",
                dulation: 3600
            },
            {
                start_time: "2020-03-14T13:00-07:00",
                identifier: "Time Slot E",
                dulation: 3600
            }
        ]
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
                        attachment_id: "5e5e5fe1dbddbb73d01d9c80",
                        type: "select",
                        subtitle: "Make a selection:",
                        center_items: true,
                        disable_text_input: false,
                        items: createSelections(message.quick_replies)
                    }
                }

            } else if (message.attachment) {

                // check for list
                if (message.attachment && message.attachment.type === "template" && (message.attachment.payload.template_type === "list")) {

                    return {
                        body: '',
                        structured_content: {
                            type: "rich_link",
                            attachment_id: "5e5e5fe1dbddbb73d01d9c80",
                            title: "Website:",
                            subtitle: "More info",
                            url: message.attachment.payload.url,
                            url_text: "Link"
                        }
                    }

                // check for gallery
                } else if (message.attachment && message.attachment.payload && (message.attachment.payload.template_type === "generic")) {

                    // check if there is only one gallery element
                    if (message.attachment.payload.elements.length === 1) {
                        
                        // return rich link structured messasge
                        return {
                            body: '',
                            structured_content: {
                                title: message.attachment.payload.elements[0].title,
                                type: 'rich_link',
                                attachment_id: '5e5fc9f1dbddbb4dd892c198',
                                url: message.attachment.payload.elements[0].url
                            }
                        }
                    }

                    // else return mapped gallery for ABC
                    return {
                        body: 'Please make a selection',
                        structured_content: {
                            type: "select",
                            subtitle: "Quick Replies",
                            attachment_id: "5e5fc9f1dbddbb4dd892c198",
                            center_items: true,
                            disable_text_input: false,
                            sections: createSections(message.attachment.payload.elements),
                            items: createGalleryItems( message.attachment.payload.elements)
                        }
                    }
                }

            }
        }
    // check for date picker
    } else if (data._plugin && (data._plugin.type === "date-picker")) {
        return {
            body: 'Pick Your Date',
            structured_content: createDatePicker()
        }

    // if there is no specific webchat channel content, return the default text
    } else {
        return {
            body: output.text,
            structured_content: null
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
