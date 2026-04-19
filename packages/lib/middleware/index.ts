/**
 * Middleware exports
 */

export {
  requireAuth,
  requireCSRF,
  requireAuthAndCSRF,
  authError,
  authSuccess,
  type AuthPayload,
  type AuthMiddlewareOptions,
} from './auth.middleware';

export {
  protectGetRoute,
  protectPostRoute,
  protectPutRoute,
  protectDeleteRoute,
  protectPatchRoute,
  protectRoute,
} from './route.protection';
