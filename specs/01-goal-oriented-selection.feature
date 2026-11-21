Feature: Goal-Oriented Linux Selection (The 20 Questions Game)
  As a computer user with any level of technical experience
  I want to answer intuitive, plain-English questions about what I want to accomplish
  So that I am matched with the ideal Linux distribution or turnkey appliance without confusing jargon

  Background:
    Given the DistroTailor 20 Questions engine is initialized
    And the registry contains desktop, appliance, embedded, server, and container distributions

  Scenario: Novice user wants a living room media center
    Given the user selects experience level "New to Linux & Open Source / Just have a goal in mind"
    When the user selects goal "Living Room Media Center / TV Box (Kodi)"
    Then the engine should recommend "LibreELEC" with a match score of at least 80%
    And the recommendation should highlight remote-control navigation and HDMI-CEC support
    And the recommendation should suggest modular add-ons such as RetroArch gaming and home streaming

  Scenario: Family wants a private photo/video backup and home NAS
    Given the user selects experience level "New to Linux & Open Source / Just have a goal in mind"
    When the user selects goal "Family Photo/Video Backup & Home Storage (NAS)"
    Then the engine should recommend "OpenMediaVault (OMV)" with a match score of at least 80%
    And the recommendation should highlight replacing iCloud and Google Photos fees with automated Wi-Fi phone sync
    And the recommendation should suggest modular add-ons such as Home Assistant and Pi-hole ad-blocking

  Scenario: Homeowner wants a private local smart home hub
    Given the user selects experience level "New to Linux & Open Source / Just have a goal in mind"
    When the user selects goal "Smart Home Automation Hub (Home Assistant)"
    Then the engine should recommend "Home Assistant OS (HAOS)" with a match score of at least 80%
    And the recommendation should highlight 100% private local execution without cloud subscription fees
    And the recommendation should explain atomic A/B dual-rootfs rollbacks

  Scenario: Product creator wants to boot directly into a custom application
    Given the user selects experience level "New to Linux & Open Source / Just have a goal in mind"
    When the user selects goal "Dedicated Single-App Appliance / Custom Product"
    Then the engine should recommend "Cage Wayland Appliance"
    And the generated recipe should provide an auto-restart watchdog loop
    And the recipe should support custom application binaries via "APP_CMD"

  Scenario: Network engineer needs a high-throughput enterprise firewall and routing appliance
    Given the criteria specify "router-networking" use case
    And the target architecture is 64-bit x86 with standard footprint and 4GB RAM
    When the engine evaluates the candidate distributions
    Then the engine should recommend "OPNsense" with a match score of at least 80%
    And the recommended OS family should be "bsd" and kernel model "monolithic-bsd"
    And the recommendation should highlight stateful packet filtering, Suricata IDS/IPS, and WireGuard VPN

  Scenario: Systems builder needs an ultra-minimal real-mode OS for legacy hardware or vintage gaming
    Given the criteria specify "appliance-product" use case
    And the user specifies a micro footprint under 16MB RAM on x86 hardware with no C library
    When the engine evaluates the candidate distributions
    Then the engine should recommend "FreeDOS" with a match score of at least 80%
    And the recommended OS family should be "independent" and kernel model "realmode-dos"
    And the recommendation should highlight 100% MS-DOS compatibility and sub-second boot times

  Scenario: Enterprise cloud architect needs a stateless hypervisor with Solaris Zones and ZFS
    Given the criteria specify "hypervisor-vms" use case
    And the user specifies a stateless RAM boot model on x86 server hardware
    When the engine evaluates the candidate distributions
    Then the engine should recommend "SmartOS" with a match score of at least 80%
    And the recommended OS family should be "independent" and kernel model "illumos"
    And the recommendation should highlight Solaris Zones, DTrace, and Crossbow network virtualization

  Scenario: Industrial technician needs native Windows NT driver and software compatibility without Windows
    Given the criteria specify "desktop" use case
    And the user specifies a Windows-style interface on low RAM with no standard C library
    When the engine evaluates the candidate distributions
    Then the engine should recommend "ReactOS" with a match score of at least 80%
    And the recommended OS family should be "independent" and kernel model "hybrid-nt"
    And the recommendation should highlight clean-room NT architecture and binary driver compatibility

  Scenario: Power user wants an ultra-responsive, non-Unix personal desktop operating system
    Given the criteria specify "desktop" use case
    And the user specifies a compact traditional workflow on lean hardware with no Unix C library
    When the engine evaluates the candidate distributions
    Then the engine should recommend "Haiku" with a match score of at least 80%
    And the recommended OS family should be "independent" and kernel model "beos-modular"
    And the recommendation should highlight BeOS heritage, OpenBFS filesystem indexing, and 3-second boot times

  Scenario: Systems engineer requires native OpenZFS storage pools and datasets
    Given the user specifies experience level "Systems Hacker / Embedded Engineer"
    And the user specifies root filesystem "zfs"
    When the engine evaluates the candidate distributions
    Then the top recommendations should include "TrueNAS SCALE" or "Proxmox VE"
    And the recommendation reasons should highlight native ZFS root storage pool with datasets and snapshots

  Scenario: Audio engineer requires PREEMPT_RT realtime low-latency kernel
    Given the user specifies kernel flavor "realtime-rt"
    When the engine evaluates the candidate distributions
    Then the engine should recommend "Ubuntu Studio" with a match score of at least 80%
    And the recommendation reasons should highlight deterministic PREEMPT_RT audio and video scheduling

  Scenario: Freelancer needs a reliable home office workstation for documents and video calls
    Given the user selects experience level "New to Linux & Open Source / Just have a goal in mind"
    When the user selects goal "Home Office & Freelancing (Word, Excel, Invoicing, Zoom, Slack)"
    Then the engine should recommend "Linux Mint" or "Fedora Workstation" with a match score of at least 80%
    And the recommendation should highlight 100% Microsoft Office compatibility and Timeshift snapshot rollbacks
    And the recommendation should suggest modular add-ons such as OnlyOffice editors and web app managers

  Scenario: Digital artist and video editor needs a turnkey creative multimedia studio
    Given the user selects experience level "New to Linux & Open Source / Just have a goal in mind"
    When the user selects goal "Graphic Design, 3D Art & Video Production (Blender, Krita, DaVinci)"
    Then the engine should recommend "Ubuntu Studio" with a match score of at least 80%
    And the recommendation should highlight low-latency kernel, drawing tablet calibration, and pre-installed Krita and Blender
    And the recommendation should suggest modular add-ons such as DaVinci Resolve setup and PipeWire audio routing

  Scenario: Beginner goal choices are ordered from everyday needs to specialized maker and hacker builds
    Given the user selects experience level "New to Linux & Open Source / Just have a goal in mind"
    When the wizard presents "What do you want to build or accomplish?"
    Then common everyday goals (Everyday Computer, Revive an Ancient PC, Home Office, Coding & Software Development, Browser Sandbox, Kid-Safe Computer) should appear before home/media goals
    And home/media/gaming goals (including Music & Pro Audio Studio) should appear before self-hosting, maker appliances, and hacker/compute builds (Router, GPS, Kiosk, Hypervisor, AI/LLM, Mining, Privacy & Cybersecurity)

  Scenario: Beginner wants coding, pro audio, or privacy/cybersecurity builds
    Given the user selects experience level "New to Linux & Open Source / Just have a goal in mind"
    When the user selects "Coding & Software Development (VS Code, Git, Python, Node)"
    Then the criteria should pre-select desktop developer apps (VS Code, Git, Python, Node.js)
    When the user selects "Music Production, Podcasting & Pro Audio Studio (Ardour, PipeWire)"
    Then the engine should enable realtime audio (realtimeAudio: true) and recommend "Ubuntu Studio"
    When the user selects "Privacy, Anonymity & Cybersecurity (Tails / Kali Linux)"
    Then the engine should recommend "Tails" for beginner amnesic privacy or "Kali Linux" for intermediate rolling pentesting

  Scenario: Maker or driver wants an offline in-car GPS or repurposed PND navigation appliance
    Given the user selects experience level "New to Linux & Open Source / Just have a goal in mind"
    When the user selects goal "In-Car GPS & Offline Navigation (Navit + OpenStreetMap)"
    Then the engine should pre-configure a screen-ready kiosk compositor (cage) with Navit and GPSd defaults
    And the wizard should skip desktop-vs-headless and desktop layout prompts for this appliance goal
    And the engine should recommend a lightweight appliance distribution
    And the generated recipe should support bundling "bootstrap-navigation.sh" with GPSd and Navit configuration
    And the recipe should support offline OpenStreetMap vector data and serial NMEA receiver auto-detection

  Scenario: Switching between Goal Mode and Technical Mode on the fly
    Given the user is currently on Question 2 in "Goal Mode"
    When the user clicks the "⇄ switch" toggle button in the question header
    Then the wizard should smoothly transition to "Technical Mode"
    And technical questions such as architecture, C library, and immutability should become accessible
    And previously compatible answers should be preserved without restarting
    And the shareable URL should list the answered questions of the new mode
    And pressing Undo should restore the previous mode and its technical answers

  Scenario: Answering a question never hides that same question
    Given the user is in "Technical Mode" with a server use case
    When the user answers "Display Mode" or "Audio Latency"
    Then the answer should be kept and the question should stay in the answered list
    And the wizard should advance to the next question instead of jumping to results
    But a question already decided by an earlier answer (e.g. a desktop goal setting a screen) should still be skipped

  Scenario: Goal Mode infers answers from the goal and device instead of asking
    Given the user is in "Goal Mode"
    When the user picks a goal such as "Home Server" and a device such as "Standard Desktop PC"
    Then the engine should infer a headless display, LTS releases, and SSD boot storage
    And the wizard should skip the Display Mode, Release Cadence, Boot Medium, and Audio Latency questions
    And personal preferences such as desktop layout style should still be asked
    When the user switches to "Technical Mode" to fine-tune
    Then the inferred questions should be offered again with the inferred answers pre-selected

  Scenario: Adaptive Multi-Question Flow across Release Cadence, Display Mode, and Drivers
    Given the user progresses through the tailored question flow
    When navigating beyond basic goals and hardware platforms
    Then the engine should adaptively prompt for display mode (Screen / Display Attached vs No Screen / Headless)
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

  Scenario: Desktop Workflow Familiarity Tailoring for Windows, Mac, and Touch/Chromebook Users
    Given the user selects a graphical desktop system (prefersGui: true)
    When the wizard prompts for desktop workflow and interface familiarity
    Then the user can choose between "Windows-Style", "macOS-Style", "Tablet / Mobile / Chromebook", or "Traditional / Lightweight"
    And selecting "Windows-Style" awards an affinity bonus to Linux Mint Cinnamon and KDE Plasma
    And selecting "macOS-Style" awards an affinity bonus to Pop!_OS COSMIC and Fedora/Ubuntu GNOME
    And selecting "Tablet / Mobile / Chromebook" awards an affinity bonus to Endless OS with its full-screen app grid and touch navigation
    And selecting "Traditional / Lightweight" awards an affinity bonus to antiX and lightweight window managers

  Scenario: Skip Default Behavior Applies Question Defaults Cleanly
    Given the user is answering an optional question with a default recommendation
    When the user clicks "Skip (Use Default)"
    Then the question's default criteria is applied to the active profile
    And the user advances to the next question with their choices accurately tracked
    And stepping back highlights the applied default option without leaving unconstrained empty criteria
    And skipping all questions falls back gracefully to Linux Mint as the Universal Baseline at 100% instead of unconstrained ties
    And allow additional alternative comparisons to grow dynamically in the data registry

  Scenario: Exact alignment bonuses separate otherwise tied perfect matches
    Given a user requests a "standard" storage footprint
    When the matcher normalizes scores against the maximum achievable weight
    Then the maximum includes the flagship use-case and exact footprint tier bonuses
    And Debian, which sits exactly in the "standard" tier, scores 100%
    And Alpine, which is far smaller than requested, no longer ties it at 100%

  Scenario: Curated distro affinities live in a validated data catalog
    Given hardware, workflow, driver, boot-medium, and peripheral affinities are defined in "taxonomy/affinities.ts"
    When a contributor adds or renames a distribution
    Then the affinity integrity test fails for any affinity referencing an unknown distro id
    And the matcher applies the first matching affinity tier without hardcoded distro id checks
    And criteria whose keys are all undefined fall back to the Universal Baseline

  Scenario: Keyboard shortcuts always answer the question currently on screen
    Given the user has answered the first question with the "1" key
    When the next question renders and the user presses a number key again
    Then the answer applies to the question currently displayed, not the first question
    And ArrowLeft steps back and Escape closes open modals or the expert matrix

  Scenario: Testing Deterministic Builds via Example Persona URL Permalinks
    Given a developer wants to test-drive custom build recipes in VMs or emulators
    When the developer queries an example persona permalink such as "Declarative NixOS Workstation"
    Then the decision engine applies the preset criteria directly to the active state
    And transitions immediately to the results view
    And displays the recommended distribution, custom build recipe, and 3-tier VM test commands

  Scenario: 100% Distro Reachability via Deterministic URL Permalinks
    Given all 31 distributions are cataloged in the taxonomy registry
    When a user or automated test queries any distribution by its canonical target URL
    Then the decision engine must rank that distribution as the #1 champion
    And the compatibility score must be at least 80%
    And users can click "Load Match" directly from the distro preview modal to jump straight to its winning build recipe
    And all relevant questionnaire steps in the wizard display their selected cards with zero blank pages

  Scenario: Smart adaptive wizard navigation and in-place review
    Given the user is answering a question for the first time in the wizard
    When the user clicks or presses a key to select an option
    Then the option flashes an emerald pulse and automatically advances to the next question
    When the user navigates back to review or modify a previously answered question
    And selects a different option
    Then the criteria update immediately in-place without auto-advancing
    And the wizard remains on the current question to let the user review or adjust

  Scenario: Dynamic decision-tree conflict reconciliation on upstream modification
    Given the user previously answered questions along a specific technical branch
    When the user changes an upstream answer such that downstream questions are no longer eligible
    Then the engine automatically prunes the answered state of those downstream questions
    And clears the orphaned criteria keys while preserving expert overrides and eligible criteria

  Scenario: Visual distinction between system default placeholder and manual selection
    Given an optional question with a standard default is presented in the wizard
    When the user has not manually selected any option
    Then the "★ Standard Default" badge displays a distinct emerald outline
    And the card itself remains unselected with no active glow
    When the user explicitly clicks the default option
    Then the chosen card receives the full active selection border, glow, and "✓ Selected" badge
    And the redundant "★ Standard Default" badge is hidden on that card to eliminate visual noise
    And the "Return to Results" button is available in the header if a match was already reached

  Scenario: Inline quick search filter for questionnaire steps with long lists
    Given a questionnaire step has 7 or more option cards
    When the question renders on screen
    Then an inline search input is displayed directly above the cards
    When the user types a keyword into the filter input
    Then the option grid immediately filters to display only cards matching the query
    And typing number keys in the filter input does not trigger option selection shortcuts
    And clearing the filter or pressing Escape restores all original option cards



  Scenario: Security-conscious user requires UEFI Secure Boot with a signed shim
    Given the user specifies Secure Boot "required"
    When the engine evaluates the candidate distributions
    Then signed-shim distributions such as "Ubuntu", "Fedora", and "Debian" should outrank "Arch Linux" and "Alpine"
    And the recommendation reasons should highlight the Microsoft-signed shim

  Scenario: Legacy hardware owner needs BIOS (MBR) boot support
    Given the user specifies firmware mode "legacy-bios"
    When the engine evaluates the candidate distributions
    Then "antiX" should outrank UEFI-only images such as "Bazzite"

  Scenario: Hardened-workstation builder wants TPM-sealed disk unlock with their own signing keys
    Given the user specifies Secure Boot "own-keys" and TPM usage "disk-unlock"
    When the engine evaluates the candidate distributions
    Then "NixOS", "Talos Linux", or "Arch Linux" should rank at the top

  Scenario: Homelab builder wants a KVM/QEMU virtualization host
    Given the user specifies virtualization host "kvm-qemu"
    When the engine evaluates the candidate distributions
    Then "Proxmox VE", "TrueNAS SCALE", or "SmartOS" should rank at the top
    And distributions without KVM support such as "FreeDOS" should be penalized

  Scenario: Networking engineer wants a bhyve hypervisor host
    Given the user specifies virtualization host "bhyve"
    When the engine evaluates the candidate distributions
    Then "OPNsense" should outrank Linux distributions that only offer KVM or Xen

  Scenario: Gamer wants GPU passthrough into a virtual machine
    Given the user specifies device passthrough "gpu-vfio"
    When the engine evaluates the candidate distributions
    Then distributions with documented IOMMU / VFIO support should be boosted
    And distributions with no passthrough support should be penalized

  Scenario: Going back from results to change an earlier answer
    Given the user has reached the results page
    When the user goes back and changes an earlier answer such as the goal
    Then answers inferred from the old choice should be replaced by the new choice's inferences
    And answers the user picked explicitly in later questions should be kept
    And the device answer should still decide hardware (platform, footprint) over the goal's guesses
    And answers that no longer apply should be cleared
    When the edit unlocks questions that were skipped before
    Then pressing Next at the end of the flow should visit those questions before showing results
    When the user returns to results
    Then a banner should say whether the top match changed (e.g. "Ubuntu → Raspberry Pi OS") and list the edited choices
    And it should offer to answer any newly unlocked questions, and can be dismissed

  Scenario: Everyday privacy without the anonymity toolkit
    Given the user picks the goal "Private Everyday Computer (No Tracking, Encrypted Disk)"
    When the user picks a desktop PC, laptop, or Chromebook
    Then the engine should recommend a distribution with no telemetry by default and installer disk encryption (e.g. "Linux Mint", "Fedora", or "Debian")
    And it should not recommend the amnesic or pentesting systems ("Tails", "Kali Linux"), which remain under the separate privacy, anonymity & cybersecurity goal

  Scenario: A small business or shop gets a simple office server
    Given the user picks the goal "Small Business or Shop Office (Shared Files, Printer & Backups)"
    When the user picks a desktop PC, Raspberry Pi, or old gadget
    Then the engine should recommend "OpenMediaVault (OMV)" (or "TrueNAS SCALE" on a used rack server)
    And the office deployment site and long-term releases should be inferred without asking
    And the legal notes should mention that customer and staff data may be regulated, for information only
    And "Unraid" should only appear as a paid alternative
