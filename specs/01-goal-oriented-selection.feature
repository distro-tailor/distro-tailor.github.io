Feature: Goal-Oriented Linux Selection (The 20 Questions Game)
  As a computer user with any level of technical experience
  I want to answer intuitive, plain-English questions about what I want to accomplish
  So that I am matched with the ideal Linux distribution or turnkey appliance without confusing jargon

  Background:
    Given the DistroTailor 20 Questions engine is initialized
    And the registry contains desktop, appliance, embedded, server, and container distributions

  Scenario: Novice user wants a living room media center
    Given the user selects experience level "New to Linux / Just have a goal in mind"
    When the user selects goal "Living Room Media Center / TV Box (Kodi)"
    Then the engine should recommend "LibreELEC" with a match score of at least 80%
    And the recommendation should highlight remote-control navigation and HDMI-CEC support
    And the recommendation should suggest modular add-ons such as RetroArch gaming and home streaming

  Scenario: Family wants a private photo/video backup and home NAS
    Given the user selects experience level "New to Linux / Just have a goal in mind"
    When the user selects goal "Family Photo/Video Backup & Home Storage (NAS)"
    Then the engine should recommend "OpenMediaVault (OMV)" with a match score of at least 80%
    And the recommendation should highlight replacing iCloud and Google Photos fees with automated Wi-Fi phone sync
    And the recommendation should suggest modular add-ons such as Home Assistant and Pi-hole ad-blocking

  Scenario: Homeowner wants a private local smart home hub
    Given the user selects experience level "New to Linux / Just have a goal in mind"
    When the user selects goal "Smart Home Automation Hub (Home Assistant)"
    Then the engine should recommend "Home Assistant OS (HAOS)" with a match score of at least 80%
    And the recommendation should highlight 100% private local execution without cloud subscription fees
    And the recommendation should explain atomic A/B dual-rootfs rollbacks

  Scenario: Product creator wants to boot directly into a custom application
    Given the user selects experience level "New to Linux / Just have a goal in mind"
    When the user selects goal "Dedicated Single-App Appliance / Custom Product"
    Then the engine should recommend "Cage Wayland Appliance"
    And the generated recipe should provide an auto-restart watchdog loop
    And the recipe should support custom application binaries via "APP_CMD"

  Scenario: Freelancer needs a reliable home office workstation for documents and video calls
    Given the user selects experience level "New to Linux / Just have a goal in mind"
    When the user selects goal "Home Office & Freelancing (Word, Excel, Invoicing, Zoom, Slack)"
    Then the engine should recommend "Linux Mint" or "Fedora Workstation" with a match score of at least 80%
    And the recommendation should highlight 100% Microsoft Office compatibility and Timeshift snapshot rollbacks
    And the recommendation should suggest modular add-ons such as OnlyOffice editors and web app managers

  Scenario: Digital artist and video editor needs a turnkey creative multimedia studio
    Given the user selects experience level "New to Linux / Just have a goal in mind"
    When the user selects goal "Graphic Design, 3D Art & Video Production (Blender, Krita, DaVinci)"
    Then the engine should recommend "Ubuntu Studio" with a match score of at least 80%
    And the recommendation should highlight low-latency kernel, drawing tablet calibration, and pre-installed Krita and Blender
    And the recommendation should suggest modular add-ons such as DaVinci Resolve setup and PipeWire audio routing

  Scenario: Switching between Goal Mode and Technical Mode on the fly
    Given the user is currently on Question 2 in "Goal Mode"
    When the user clicks the "⇄ switch" toggle button in the question header
    Then the wizard should smoothly transition to "Technical Mode"
    And technical questions such as architecture, C library, and immutability should become accessible
    And previously compatible answers should be preserved without restarting

  Scenario: Adaptive Multi-Question Flow across Release Cadence, Display Mode, and Drivers
    Given the user progresses through the tailored question flow
    When navigating beyond basic goals and hardware platforms
    Then the engine should adaptively prompt for display mode (Headless vs Graphical GUI)
    And prompt for release update cadence (Stable Long-Term Support LTS vs Bleeding-Edge Rolling)
    And prompt for hardware driver preference (Seamless Proprietary vs 100% Free Software)
    And prompt for boot storage medium (NVMe/SSD vs SD Card/Flash vs Diskless PXE)
    And if multimedia or audio production is targeted, prompt for real-time low-latency audio kernel

  Scenario: Early High-Confidence Match Prediction in 20 Questions
    Given the user has answered at least 3 questions in the wizard
    When a single distribution achieves a dominant compatibility score of at least 85%
    Then the wizard should display an early fast-track prediction banner
    And offer a one-click action to view the tailored match immediately
    And still allow the user to continue answering remaining questions to refine further

  Scenario: Transparent Rationale Explaining Tailored Choices Over Popular Alternatives
    Given the recommendation engine outputs a tailored distribution like Linux Mint or Fedora Workstation
    When the user inspects the recommendation or contenders
    Then the system should provide data-driven comparative rationales against household names
    And explain why Linux Mint is chosen over Vanilla Ubuntu (native packaging, zero Snap overhead, familiar Cinnamon desktop)
    And explain why Fedora Workstation is chosen over Red Hat Enterprise Linux (official modern upstream workstation, zero subscription paywalls, fresh office productivity tools)
    And allow additional alternative comparisons to grow dynamically in the data registry
