import { handleApi } from '../website/server/api-handler.mjs';
// Vercel entry for the website's /api routes. Projects are not stored here: off loopback hosts
// the canvas store routes refuse with 403, and web mode keeps projects in the visitor's browser.
export default async function handler(request, response) {
  if (!(await handleApi(request, response))) { response.statusCode = 404; response.end(); }
}
