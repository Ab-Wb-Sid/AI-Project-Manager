/**
 * Full page load instead of client navigation. Used when the signed-in user changes
 * (login, logout, expired session) so no screens from the previous session stay mounted:
 * with Cache Components, Next keeps recently visited routes alive in hidden <Activity> trees.
 */
export function hardNavigate(path: string, { replace = false } = {}) {
  if (replace) window.location.replace(path);
  else window.location.assign(path);
}
