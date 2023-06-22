const PROJECT_ID = "project-id";
const ORGANISATION_ID = "organisation-id";
const AAW_BASE_URL = "https://agent-assist-dev.cognigy.ai";

const getSession = (userId: string, sessionId: string) =>
  getSessionStorage(userId, sessionId);
const getForeignSession = (foreignSessionId: string) =>
  getSessionStorage(foreignSessionId, foreignSessionId);

/**
 * this input transformer wrapper forwards incoming messages to a contact center
 *
 * initially, it will create a conversation with the contact center on first input
 * and store the "foreignSessionId" from the contact center into the session storage.
 *
 * it will then proceed to forward any incoming message to the contact center,
 * using the previously stored foreignSessionId
 *
 * it's supposed to be "wrapped around" the handleInput transformer function:
 *
 * withForwardToCC(() => {
 *  // your regular input transformer
 * });
 */
const forwardInputToContactCenter =
  (next: IBaseTransformer["handleInput"]): IBaseTransformer["handleInput"] =>
  async (params) => {
    ////////////////////////////////////////////////////////////
    // ASSURE CORRECT SHAPE OF INPUT BY PREPROCESSING IT
    ////////////////////////////////////////////////////////////
    const input = await next(params);

    ////////////////////////////////////////////////////////////
    // ASSURE FOREIGN SESSION ID / INITIALIZE CONVERSATION IN CC
    ////////////////////////////////////////////////////////////
    const session = await getSession(input.userId, input.sessionId);

    if (!session.foreignSessionId) {
      console.log(`[FORWARD] initializing conversation in contact center"`);

      //////////////////////////////////////////////////////////
      // YOUR "CREATE CONVERSATION" REQUEST GOES HERE
      //////////////////////////////////////////////////////////
      //
      // if the foreign session id is not yet known, create a conversation
      // in the contact center and extract their foreign session id
      // (example request below)
      //
      // const response = await httpRequest({
      // 	uri: "https://contactcenter/api/createconversation",
      // 	method: "POST",
      // 	headers: {
      // 		"Content-Type": "application/json"
      // 	},
      // 	body: {
      // 		userId: input.userId,
      // 		sessionId: input.sessionId
      // 	},
      // 	json: true
      // });
      // const { conversationId: foreignSessionId } = response;

      // dummy version: generate a random id for this session instead of contacting a cc
      const foreignSessionId = String(Math.floor(Math.random() * Date.now()));

      session.foreignSessionId = foreignSessionId;
      console.log(
        `[FORWARD] initialized conversation in contact center; got foreign session id "${session.foreignSessionId}"`
      );
    } else {
      console.log(
        `[FORWARD] resolved foreign session id "${session.foreignSessionId}" from session storage`
      );
    }

    ////////////////////////////////////////////////////////////
    // FORWARD MESSAGE TO CONTACT CENTER
    ////////////////////////////////////////////////////////////
    console.log(
      `[FORWARD] forwarding message to contact center conversation; used foreign session id "${session.foreignSessionId}"`
    );

    ////////////////////////////////////////////////////////////
    // YOUR "FORWARD MESSAGE" REQUEST GOES HERE
    ////////////////////////////////////////////////////////////
    //
    // const response = await httpRequest({
    // 	uri: "https://contactcenter/api/createconversation",
    // 	method: "POST",
    // 	headers: {
    // 		"Content-Type": "application/json"
    // 	},
    // 	body: {
    // 		userId: input.userId,
    // 		sessionId: input.sessionId
    // 	},
    // 	json: true
    // });
    // const { conversationId: foreignSessionId } = response;

    console.log(
      `[FORWARD] forwarded message to contact center conversation; used foreign session id "${session.foreignSessionId}"`
    );

    return input;
  };

/**
 * converts a flat object of strings/booleans/numbers into a query string
 */
const toQueryString = (obj: any) =>
  Object.entries(obj)
    .map(([key, value]) => `${key}=${value}`)
    .join("&");

/**
 * this transformer wrapper function adds the capability to embed an agent assist workspace
 * to the input transformer, using only a foreign session id as a parameter.
 *
 * when used, the contact center may embed https://<endpoint-base-url>/<url-token>?aaw=<foreign-session-id>
 * this function will cause the request to be forarded to the agent assist workspace,
 * with all necessary parameters resolved.
 *
 * it expects that after processing the "next" function for regular messages,
 * the session storage for userId,sessionId contains a field "foreignSessionId"
 *
 * this function is supposed to be "wrapped around" a handleInput transformer function:
 * withAAWRedirect(() => {
 *   // your regular input transformer
 * })
 */
const withAAWRedirect =
  (next: IBaseTransformer["handleInput"]): IBaseTransformer["handleInput"] =>
  async (params) => {
    const { endpoint, request, response } = params;

    const aawRedirectId = (() => {
      if (request.method.toLowerCase() !== "get") return;

      const { aaw } = request.query;

      if (!aaw) return;

      return aaw;
    })();

    if (!aawRedirectId) {
      const input = await next(params);
      const session = await getSession(input.userId, input.sessionId);

      ////////////////////////////////////////////////////////////
      // ASSURE FOREIGN SESSION PARAMETER MAPPING
      ////////////////////////////////////////////////////////////

      const foreignSession = await getForeignSession(session.foreignSessionId);

      if (!foreignSession.userId) {
        console.log(
          `[REDIRECT] storing session parameters for foreign session with id "${session.foreignSessionId}"`
        );
        foreignSession.userId = input.userId;
        foreignSession.sessionId = input.sessionId;
      }

      console.log("[REDIRECT] RETURN INPUT");
      return input;
    }

    console.log(
      `[REDIRECT] processing AAW embedding redirect for foreign session id "${aawRedirectId}"`
    );

    const aawSessionParams = await (async () => {
      // read userId/sessionId previously stored in session storage at foreignSessionId
      const foreignSessionStorage = await getForeignSession(aawRedirectId);
      const { userId, sessionId } = foreignSessionStorage;

      if (!userId || !sessionId) return null;

      const { URLToken } = endpoint;
      const { agentAssistConfigId } =
        endpoint.handoverSettings.agentAssistSettings;

      return {
        userId,
        sessionId,
        URLToken,
        projectId: PROJECT_ID,
        organisationId: ORGANISATION_ID,
        configId: agentAssistConfigId,
      };
    })();

    if (!aawSessionParams) {
      response.status(404).send("session not found");
      console.log("REDIRECT] session not found");
      return null;
    }

    const aawRedirectUrl = `${AAW_BASE_URL}/?${toQueryString(
      aawSessionParams
    )}`;

    console.log(
      `[REDIRECT] redirected aaw embedding for foreign session id "${aawRedirectId}"`
    );
    response.redirect(aawRedirectUrl);
    return null;
  };

createWebhookTransformer({
  /**
   * This transformer is executed when receiving a message
   * from the user, before executing the Flow.
   *
   * @param endpoint The configuration object for the used Endpoint.
   * @param request The Express request object with a JSON parsed body.
   * @param response The Express response object.
   *
   * @returns A valid userId, sessionId, as well as text and/or data,
   * which has been extracted from the request body.
   */
  handleInput: withAAWRedirect(
    forwardInputToContactCenter(async ({ endpoint, request, response }) => {
      const { userId, sessionId, text, data } = request.body;

      return {
        userId,
        sessionId,
        text,
        data,
      };
    })
  ),

  /**
   * This transformer is executed on every output from the Flow.
   * For Webhook based transformers, the return value of this transformer
   * will be sent directly to the user.
   *
   * @param processedOutput The output from the Flow that has been processed into the final object
   * that will be sent to the user. It is structured according to the data structure used
   * on the specific Endpoint channel.
   *
   * @param output The raw output from the Flow.
   * @param endpoint The configuration object for the used Endpoint.
   * @param userId The unique ID of the user.
   * @param sessionId The unique ID for this session. Can be used together with the userId
   * to retrieve the sessionStorage object.
   *
   * @returns An object that will be sent to the user, unchanged. It therefore has to have the
   * correct format according to the documentation of the specific Endpoint channel.
   */
  handleOutput: async ({
    processedOutput,
    output,
    endpoint,
    userId,
    sessionId,
  }) => {
    return processedOutput;
  },

  /**
   * This transformer is executed when the Flow execution has finished.
   * Since all outputs have been sent to the user, this transformer does not return anything.
   *
   * @param userId The unique ID of the user.
   * @param sessionId The unique ID for this session. Can be used together with the userId
   * to retrieve the sessionStorage object.
   *
   * @param endpoint The configuration object for the used Endpoint.
   *
   * @returns This transformer cannot return anything.
   */
  handleExecutionFinished: async ({ sessionId, userId, endpoint }) => {},

  /**
   * This transformer is executed when receiving an inject event.
   * The extracted text and data will be injected into the conversation
   * for the given user in the given session.
   *
   * @param request The Express request object with a JSON parsed body.
   * @param response The Express response object.
   * @param endpoint The configuration object for the used Endpoint.
   *
   * @returns A valid userId, sessionId, as well as text and/or data,
   * which has been extracted from the request body. The text and data
   * will be injected into this conversation.
   */
  handleInject: async ({ request, response, endpoint }) => {
    /**
     * Extract the userId, sessionId and text
     * from the request. Example:
     *
     * const { userId, sessionId, text, data } = request.body;
     *
     * Note that the format of the request body will be different for
     * every Endpoint, and the example above needs to be adjusted
     * accordingly.
     */
    const userId = "";
    const sessionId = "";
    const text = "";
    const data = {};

    return {
      userId,
      sessionId,
      text,
      data,
    };
  },

  /**
   * This transformer is executed when receiving a notify event.
   * The extracted text and data will be sent directly to the
   * given user in the given session as a notification.
   *
   * @param request The Express request object with a JSON parsed body.
   * @param response The Express response object.
   * @param endpoint The configuration object for the used Endpoint.
   *
   * @returns A valid userId, sessionId, as well as text and/or data,
   * which has been extracted from the request body. The text and data
   * will be sent directly to the user.
   */
  handleNotify: async ({ request, response, endpoint }) => {
    /**
     * Extract the userId, sessionId and text
     * from the request. Example:
     *
     * const { userId, sessionId, text, data } = request.body;
     *
     * Note that the format of the request body will be different for
     * every Endpoint, and the example above needs to be adjusted
     * accordingly.
     */
    const userId = "";
    const sessionId = "";
    const text = "";
    const data = {};

    return {
      userId,
      sessionId,
      text,
      data,
    };
  },
});
