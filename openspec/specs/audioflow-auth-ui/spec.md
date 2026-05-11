# AudioFlow auth UI

## Requirements

### Requirement: AudioFlow login presentation

The mobile app SHALL present the login screen using the AudioFlow visual language while preserving the existing email/password authentication flow.

#### Scenario: Login screen renders AudioFlow brand and form

- **WHEN** an unauthenticated user opens `/(auth)/login`
- **THEN** the screen displays the burgundy AudioFlow background, brand heading, glass login panel, email field, password field, primary pearl login action, registration link, and password reset link

#### Scenario: Login validation remains unchanged

- **WHEN** the user submits the login form without an email or password
- **THEN** the system shows the existing validation feedback and does not call the login request

#### Scenario: Successful login navigates to app

- **WHEN** the user enters valid credentials and the login request succeeds
- **THEN** the system preserves the existing authenticated navigation to `/(app)`

#### Scenario: Failed login remains visible

- **WHEN** the login request fails
- **THEN** the system keeps the user on the AudioFlow login screen and presents the existing error feedback

### Requirement: Login excludes unsupported social authentication

The mobile app SHALL NOT present Google, Apple, or other social-login actions as available authentication methods unless the backend and auth flow support them.

#### Scenario: Social auth is not implemented

- **WHEN** the AudioFlow login screen is rendered
- **THEN** it does not expose working-looking social login buttons that would imply an unsupported authentication path
