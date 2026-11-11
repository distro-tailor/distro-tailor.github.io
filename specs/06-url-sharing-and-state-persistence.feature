Feature: URL State Sharing and Collaborative Configuration
  As a Linux enthusiast, system builder, or community member
  I want to share the exact URL of my selected criteria and build recommendations
  So that friends, teammates, or forum members can inspect, replicate, or tweak my tailored Linux setup.

  Background:
    Given the DistroTailor web application is running
    And the application operates client-side with zero backend database dependencies

  Scenario: Sharing a tailored distro match via URL
    Given the user has completed the 20 Questions questionnaire for a "Smart Home Hub" on "Raspberry Pi 4"
    And the recommendation displays "Home Assistant OS" with a 95% match
    When the user clicks the "Share This Match" button
    Then the application copies the full permalink with query parameters to the clipboard
    And the URL contains "?tab=results&useCase=smart-home&platform=embedded-sbc&architecture=arm64&footprint=lean"
    And a confirmation toast informs the user that the permalink was copied

  Scenario: Opening a shared configuration link
    Given another user receives the URL "https://distro-tailor.org/?tab=results&useCase=ai-gpu-compute&platform=bare-metal&architecture=x86_64"
    When the recipient navigates to the URL
    Then the application automatically restores all criteria from the URL parameters
    And displays "Pop!_OS" as the top recommendation with GPU compute highlights
    And displays a "Viewing Shared Build" banner acknowledging the shared configuration
    And lists all 3 criteria in "Your Choices So Far"

  Scenario: Copying Markdown summary for forum and chat sharing
    Given the user is viewing the results for their tailored build
    When the user opens the Share modal and selects "Copy Markdown"
    Then the clipboard receives formatted markdown containing:
      | Distro name and match percentage |
      | Use case and hardware summary    |
      | Key reasons to choose the distro |
      | Permitted URL back to DistroTailor |

  Scenario: Tweaking individual criteria on a shared build
    Given a recipient is viewing a shared build with "Smart Home Hub" on "ARM64"
    When the recipient clicks the remove button on the "Smart Home Hub" criterion chip
    Then the "useCase" criterion is removed while preserving "architecture=arm64"
    And the URL dynamically updates to reflect the removed constraint
    And the contenders leaderboard recalculates immediately

  Scenario: Sharing in-progress questionnaire with a mentor or peer
    Given a beginner has answered 2 questions: Experience Level and Goal
    When the user shares the current URL with a friend
    Then the friend opens the link and sees questions 1 and 2 already answered
    And the wizard prompts question 3 (Hardware / Target Device)

  Scenario: URL schema versioning guarantees forward and backward compatibility
    Given the current schema version is "v=1"
    When any shareable link or state is generated
    Then the URL explicitly prefixes the schema version parameter "?v=1"
    And future application updates run sequential schema migrations without breaking links

  Scenario: Backward-compatible normalization of legacy aliases and unversioned links
    Given a user opens an unversioned legacy link "?useCase=home-automation&platform=rpi&architecture=aarch64"
    When the application initializes
    Then the migration engine assigns schema version "v=1"
    And maps "home-automation" to canonical "smart-home"
    And maps "rpi" to canonical "embedded-sbc"
    And maps "aarch64" to canonical "arm64"
    And seamlessly updates the browser address bar to the modern canonical format

  Scenario: Schema version remains locked unless deployed with breaking parameter changes
    Given the application undergoes non-breaking updates such as adding distros, recipes, or tips
    When URL state persistence generates links
    Then the schema version remains "v=1" without premature bumps
    And schema version increments are strictly gated to breaking taxonomy changes upon deployment

  Scenario: High-Contrast Light Theme Accessibility in Share Modal and Detail Previews
    Given the user switches the application to "Light Theme"
    When the user opens the "Share Match" modal or "Distro Preview" popup
    Then all action buttons (Copy Link, Download Image, Official Site, Review Answers) must render with dark high-contrast typography
    And social quick-share cards (Reddit, X/Twitter, WhatsApp) must feature light-adapted backgrounds and high-contrast text
    And key strengths and trade-offs sections must render high-contrast emerald and amber tones without unreadable white-on-white text
