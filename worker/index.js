import { getSessionUser } from './auth.js';
import { error } from './http.js';
import { handlePublicRoute } from './routes/public.js';
import { handleAdminContentRoute } from './routes/admin-content.js';
import { handleAdminStaffRoute } from './routes/admin-staff.js';
import { handleSisRoute } from './routes/sis.js';
import { handleAdminMediaRoute, handleMediaServeRoute } from './routes/media.js';
import { handleAdminSettingsRoute } from './routes/settings.js';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const { pathname } = url;
    const method = request.method;

    try {
      if (!pathname.startsWith('/api/admin/')) {
        const mediaResponse = await handleMediaServeRoute(request, env, pathname, method);
        if (mediaResponse) return mediaResponse;

        const publicResponse = await handlePublicRoute(request, env, pathname, method);
        if (publicResponse) return publicResponse;
      }

      if (pathname.startsWith('/api/admin/')) {
        const staffUser = await getSessionUser(request, env, 'staff');
        if (!staffUser) return error('Staff sign-in required.', 401);

        const contentResponse = await handleAdminContentRoute(request, env, pathname, method, staffUser);
        if (contentResponse) return contentResponse;

        const staffResponse = await handleAdminStaffRoute(request, env, pathname, method, staffUser);
        if (staffResponse) return staffResponse;

        const sisResponse = await handleSisRoute(request, env, pathname, method, staffUser);
        if (sisResponse) return sisResponse;

        const mediaAdminResponse = await handleAdminMediaRoute(request, env, pathname, method, staffUser);
        if (mediaAdminResponse) return mediaAdminResponse;

        const settingsResponse = await handleAdminSettingsRoute(request, env, pathname, method, staffUser);
        if (settingsResponse) return settingsResponse;

        return error('Not found.', 404);
      }

      if (pathname.startsWith('/api/')) {
        return error('Not found.', 404);
      }

      // Any non-API path reaching the Worker falls back to static assets.
      return env.ASSETS.fetch(request);
    } catch (err) {
      return error(`Server error: ${err.message}`, 500);
    }
  },
};
