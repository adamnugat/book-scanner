## 1. Data Fetching & Layout Setup

- [x] 1.1 Update `ProjectDetailScreen` in `apps/mobile/app/(app)/projects/[id]/index.tsx` to fetch `api.getAudioTracks(id)` alongside `api.getProject(id)` using `Promise.all`.
- [x] 1.2 Add state variable `hasAudio` based on the length of the fetched audio tracks array.
- [x] 1.3 Remove padding from the main `ScrollView` container to allow the cover image to touch the screen edges.

## 2. UI Components Implementation

- [x] 2.1 Implement the "Consumption State" UI: Add a cover image container with `height: Dimensions.get('window').height * 0.5` and `width: '100%'`.
- [x] 2.2 Add a placeholder/gradient background for the cover image (using `LinearGradient` or a solid color with an icon) if `project.coverUrl` is null.
- [x] 2.3 Add a prominent "Play" button positioned absolutely at the bottom of the cover image container, linking to `/(app)/projects/${id}/player`.
- [x] 2.4 Implement the "Creation State" UI: Keep the existing "Next Step" card but ensure it only renders when `hasAudio` is false.
- [x] 2.5 Implement the tools grid layout below the main header area using `flexDirection: 'row'` and `flexWrap: 'wrap'` for "Images", "Voice", and "Share" buttons.

## 3. Navigation & Context Menu

- [x] 3.1 Use `<Stack.Screen options={{ headerRight: ... }}>` inside `index.tsx` to add a settings/more icon to the navigation header.
- [x] 3.2 Implement an `ActionSheetIOS` (for iOS) or `Alert` (for Android) that opens when the header icon is pressed, containing "Edit Project" and "Delete Project" options.
- [x] 3.3 Move the existing delete logic (`handleDelete`) and edit navigation into this new context menu.
- [x] 3.4 Remove the old "Edit Project" and "Delete Project" buttons from the main scroll view.

## 4. Verification

- [x] 4.1 Run `npm run lint` and `npm run format:check` to ensure code quality.
- [x] 4.2 Run `npm run test:mobile` to verify no existing tests are broken.
- [x] 4.3 Manually verify the UI in the Expo Go app or simulator for both a project with audio and a project without audio.
