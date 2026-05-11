## Visual Implementation Notes

- Manual comparison was performed against the HTML reference structure for `New Project.html` and `Add Photos.html`: title blocks, source actions, picker cards, glass surfaces, and pearl primary actions are represented in the React Native implementation.
- React Native does not provide a portable `backdrop-filter: blur(3px)` equivalent across iOS, Android, and web in the current app setup, so glass surfaces use translucent burgundy fills, glass-edge borders, rounded corners, and platform shadows instead of real background blur.
- The HTML reference uses pearl gradients and CSS box shadows. The mobile implementation keeps the pearl CTA color, rounded shape, disabled state, press feedback, and shadow/glow treatment, but avoids adding a gradient dependency in this first pass.
- Material Symbols from the HTML reference were not introduced as a runtime dependency. The first implementation keeps the layout and action hierarchy with text/simple glyph affordances so the design system can land without expanding icon/font setup.
- The `Add Photos` reference shows a fixed bottom navigation with a raised circular arrow CTA. The mobile implementation uses a glass footer with a pearl `Dalej` button for clearer testability and stable Expo Router behavior while preserving the primary action hierarchy.
