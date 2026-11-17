import {EndpointStats} from '~/business-logic/model/serving/endpointStats';

// An endpoint as the app holds it: the server's summary plus the id the app derives from its url when it loads the list
// (serving.effects.ts). The server does not send this id.
export type ServingEndpoint = EndpointStats & {id: string};
