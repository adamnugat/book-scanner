## 1. AudioFlow App Shell Foundation

- [x] 1.1 Extend `apps/mobile/components/audioflow.tsx` with reusable app shell primitives for brand header, round icon actions, bottom footer menu, raised pearl footer CTA, safe-area-aware footer spacing, and accessible labels.
- [x] 1.2 Add reusable AudioFlow form helpers for glass text fields, secondary form links, divider text, and disabled/loading states needed by the login screen.
- [x] 1.3 Add reusable AudioFlow dashboard helpers for project cards, status pills, toolbar chips/segmented controls, empty-state panel, and loading-state shell.
- [x] 1.4 Ensure existing `New Project` and `Add Photos` imports still compile after extending the shared AudioFlow module.

## 2. Login Screen Redesign

- [x] 2.1 Refactor `apps/mobile/app/(auth)/login.tsx` to use `AudioFlowScreen`, brand header treatment, glass form card, AudioFlow fields, and pearl login CTA from `Login.html`.
- [x] 2.2 Preserve current login behavior: empty-field validation, `login(email, password)`, loading disabled state, error alert, `router.replace('/(app)')`, and links to register/reset password.
- [x] 2.3 Exclude unsupported Google/Apple/social login actions from the implemented UI until backend auth supports them.
- [x] 2.4 Update or add focused mobile tests for login rendering, validation, loading/disabled state, successful submission, error handling, and register/reset links.

## 3. Dashboard Redesign

- [x] 3.1 Refactor `apps/mobile/app/(app)/index.tsx` to use the AudioFlow dashboard background, top brand header, welcome section, glass project cards, toolbar controls, and bottom footer menu from `Dashboard.html`.
- [x] 3.2 Preserve project data behavior: `api.getProjects`, loading state, project card navigation, empty state, filtered-empty state, filter selection, sort selection, and tablet column behavior where still applicable.
- [x] 3.3 Preserve dashboard actions: project deletion confirmation/API call/toast update, pricing navigation, logout, and create-new-project navigation.
- [x] 3.4 Replace the old floating action button with the AudioFlow footer CTA or otherwise prevent duplicate primary create actions.
- [x] 3.5 Use real project/user data for counts, titles, statuses, language/date metadata, and welcome copy; do not hardcode demo audiobook metrics from the HTML reference.

## 4. Navigation And Layout Integration

- [x] 4.1 Update `(auth)` and `(app)` layout screen options only as needed so redesigned screens do not flash or reveal the old dark-blue background/header treatment.
- [x] 4.2 Ensure footer menu destinations use valid existing routes: dashboard/library, new audiobook, and no placeholder project/player route without a concrete project id.
- [x] 4.3 Add bottom padding/safe-area handling so the footer menu does not cover dashboard list content or empty-state CTAs.
- [x] 4.4 Keep route history and back-navigation semantics unchanged for auth and app stacks.

## 5. Verification

- [x] 5.1 Run `npm run test:mobile` and fix regressions introduced by the login/dashboard refactor.
- [x] 5.2 Run `npm run lint` or the closest available mobile lint command and fix introduced issues.
- [x] 5.3 Manually compare `/(auth)/login` against `design-system/reference-views/Login.html`, documenting intentional omissions such as social login.
- [x] 5.4 Manually compare `/(app)` against `design-system/reference-views/Dashboard.html`, documenting intentional differences caused by real project data, missing playback metrics, and React Native platform limits.
