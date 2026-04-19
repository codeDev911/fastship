// Main library exports
export * from './config';
export * from './context';
export * from './services';
export * from './types';
export * from './utils';

// Core utilities
export { setSessionCookie } from './actions';
export { apiKeyErrorResponse,validateApiKey,validateApiKeyScope } from './api-key-middleware';
export { generateApiKey,getApiKeyFromHeaders,hasScope,hashApiKey,isApiKeyValid,verifyApiKey } from './api-key';
export { apiResponse } from './api-response';
export { corsMiddleware } from './cors-middleware';
export { createCORSPreflightResponse,getAllowedOrigins,getCORSHeaders,getOriginFromRequest,isCORSPreflightRequest,isOriginAllowed } from './cors';
// export * from './email';
export {decryptToken,encryptToken} from './encryption';
export { prisma } from './prisma';
export { applyCORSHeaders } from './cors-middleware';
export {useShipments,useNotifications} from './hooks'
export * from "./types"
export * from "./types/index"
export {secureFetch} from "./secure-fetch"
export {AuthProvider,useAuth} from "./context/AuthContext"
export * from "./utils/utils"
// Mock data
