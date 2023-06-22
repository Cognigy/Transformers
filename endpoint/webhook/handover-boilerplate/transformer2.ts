const handover = (() => {
  const getForeignSessionId = async (): Promise<string> => "";
  const createConversation = async (): Promise<string> => "";
  const forwardMessage = async (message) => {};

  const assureForeignSessionId = async () => {
    const foreignSessionId = await getForeignSessionId();

    if (foreignSessionId) return foreignSessionId;

    return createConversation();
  };

  /**
   * handles "agent messages" from the contact center and processes
   * them as user inputs
   */
  const handleAgentInput = (next) => async (params) => {
    const agentInput = (() => {
      // if it's not an agent input, return null,
      // otherwise return userId, sessionId, text, data
      // and append { source: "agent" } to data

      return {
        userId: "", // retreived from request
        sessionId: "", // foreignSessionId retreived from request, sessionId resolved via sessionStorage
        text: "", // retreived from request
        data: { source: "agent" },
      };
    })();

    // skips further transformers
    // since the message is resolved from the request
    if (agentInput) {
      return agentInput;
    }

    return next(params);
  };

  const forwardUserInput = (next) => async (params) => {
    const input = await next(params);

    await assureForeignSessionId();

    return input;
  };
  const forwardOutput = (next) => async (params) => {
    await assureForeignSessionId();
    await forwardMessage(params);

    return next(params);
  };
  const forwardInject = (next) => async (params) => {
    await assureForeignSessionId();
    await forwardMessage(params);

    return next(params);
  };
})();
