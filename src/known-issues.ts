// axe rule ids that already fail on each page (first run, 2026-11-04, desktop + mobile).
// Tests only fail on a new serious/critical problem. When one of these is fixed,
// remove it here so it can't come back unnoticed.
//
// button-name                  show-password button (eye icon) has no accessible name (critical)
// label-content-name-mismatch  language button: visible text "EN" is not part of its name
// list                         filter / password-help lists contain non-<li> children
// target-size                  product page: "More information" links in related products are
//                              smaller than 24x24 px with no spacing (WCAG 2.2, 2.5.8)
export const KNOWN_ISSUES: Record<string, string[]> = {
  home: ['label-content-name-mismatch', 'list'],
  login: ['button-name', 'label-content-name-mismatch'],
  'login-errors': ['button-name', 'label-content-name-mismatch'],
  register: ['button-name', 'label-content-name-mismatch', 'list'],
  contact: ['label-content-name-mismatch'],
  product: ['label-content-name-mismatch', 'target-size'],
};
