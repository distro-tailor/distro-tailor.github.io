Feature: Free & Open-Source Licensing Policy and Paid Alternatives
  As a user tailoring an OS for hardware I already own
  I want every recommendation to be free and/or open source
  So that I never have to pay to use the feature I chose, while still knowing which paid products exist

  Background:
    Given every registered distribution declares its license and a licensing model
    And the allowed licensing models are "foss", "foss-optional-paid", and "foss-with-firmware"

  Scenario: Only free and/or open-source systems can be the result
    Given the distribution registry
    Then every registered distribution should use an allowed licensing model
    And a distribution with a "freemium-closed" or "proprietary" model should never be scored, even when it is a perfect fit
    And the top match and every contender should be free and/or open source

  Scenario: Optional paid support or an enterprise edition is acceptable
    Given a distribution such as "Ubuntu", "Proxmox VE", or "TrueNAS SCALE" offers optional paid support or subscriptions
    When the chosen features work without paying
    Then the distribution may be recommended with the "foss-optional-paid" model
    And its licensing note should explain what is optional and paid

  Scenario: Vendor boot firmware does not disqualify a hardware-specific OS
    Given a board such as a Raspberry Pi or an Apple Silicon Mac needs the vendor's closed boot firmware
    And every operating system on that hardware needs the same firmware
    Then a free and open-source OS for it (e.g. "Raspberry Pi OS", "Asahi Linux") may be recommended with the "foss-with-firmware" model
    And its licensing note should name the closed firmware

  Scenario: Closed-core or usage-capped systems are excluded from the registry
    Given a system is closed source, or free only up to a usage cap (e.g. HiveOS beyond 2 rigs)
    Then it should not be a registered distribution
    And where an open-source core exists, the registry should point to it instead (e.g. the v86 emulator rather than the CheerpX-based WebVM, Wolfi rather than paid pinned Chainguard images)

  Scenario Outline: Paid systems appear only as caveated alternatives for the matching use case
    Given the user chooses the use case "<use case>"
    When the evaluation completes
    Then the top match should be a free and/or open-source distribution
    And the results page and the CLI should list "<paid system>" under "Paid alternatives (not recommended)"
    And the listing should state its caveat (what must be paid for or what is closed source)
    And the listing should name free options that cover the same need, such as "<free option>"

    Examples:
      | use case                 | paid system            | free option            |
      | AI, LLM & GPU Compute    | HiveOS (Hiveon OS)     | Ubuntu                 |
      | Family Photo & Video NAS | Unraid                 | OpenMediaVault (OMV)   |
      | Home Router & Firewall   | pfSense Plus           | OPNsense               |
      | Store Display & Kiosk    | Porteus Kiosk          | Cage Wayland Appliance |
      | In-Browser Linux (WASM)  | WebVM (CheerpX engine) | v86 (Linux in WebAssembly) |

  Scenario: No paid alternatives section when none applies
    Given the user chooses a use case with no well-known paid system (e.g. "Everyday Desktop")
    When the evaluation completes
    Then the results should not show a "Paid alternatives" section
    And the CLI JSON output should contain an empty "paidAlternatives" list

  Scenario Outline: Legal catches are stated up front
    Given the user's setup is "<setup>"
    When the evaluation completes
    Then the results page and the CLI should show the legal note "<note>"
    And the distribution's detail page should show its licence and any legal notes that always apply to it

    Examples:
      | setup                                         | note                                                    |
      | Retro gaming (Batocera) or emulator apps      | Only play games you own                                 |
      | Cybersecurity & privacy, or Kali Linux        | Test only what you are allowed to test                  |
      | AI, LLM & GPU compute, or a GPU server        | NVIDIA GeForce drivers are not licensed for datacenters |
      | AI, LLM & GPU compute (mining rigs)           | Check local rules before mining cryptocurrency          |
      | Living room media center (LibreELEC / Kodi)   | Stick to official Kodi add-ons                          |
      | Living room media center (any distro)         | Encrypted DVD and Blu-ray playback                      |
      | Tails                                         | Tor is restricted in a few countries                    |

  Scenario: No legal notes when nothing applies
    Given the user's setup has no known legal catch (e.g. a home office desktop)
    Then the results should not show a legal notes section
