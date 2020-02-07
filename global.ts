/**
 * This file is here to remove type errors for the modules that are available
 * for the transformer but not defined in this repository.
 */

declare function createSocketTransformer(object: any): any;
declare function createWebhookTransformer(object: any): any;

declare function getSessionStorage(userId: string, sessionId: string): any;

declare var httpRequest;
declare var uuid;