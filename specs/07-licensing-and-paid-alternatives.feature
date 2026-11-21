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
      | Game & LAN Party Server  | Minecraft Realms       | Ubuntu                 |

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

  Scenario Outline: The NVIDIA datacenter note follows the driver choice and where the machine runs
    Given the user is building an "AI, LLM & GPU Compute" machine
    And the driver philosophy is "<drivers>"
    When the wizard asks "Where will this machine run?" and the user answers "<site>"
    Then the NVIDIA GeForce datacenter legal note should be "<note>"

    Examples:
      | drivers               | site                                             | note      |
      | Seamless Proprietary  | Home or Homelab                                  | hidden    |
      | Seamless Proprietary  | Office or Small-Business Server Room             | shown     |
      | Seamless Proprietary  | Datacenter, Colocation, Hosting, or ISP Network  | shown     |
      | Seamless Proprietary  | (question skipped)                               | shown     |
      | 100% Free Software    | (question not asked)                             | hidden    |

  Scenario: Where the machine runs shapes server picks without slowing down beginners
    Given the user is building a machine that serves others (server, NAS, game server, community network, GPU compute, and similar)
    Then the wizard should ask "Where will this machine run?" with Home or Homelab, Office or Small-Business, Community or Remote Site, and Datacenter/Hosting/ISP answers
    And in Goal Mode the answer should be inferred from the goal (home for home servers, community for community goals) instead of asked
    And office, datacenter, and community sites should mark down rolling-release server distributions in favour of long-term releases
    But a workstation such as a pentest laptop at an office should not be marked down
    And desktops should never be asked this question

  Scenario: Hosting a Minecraft or LAN party game server
    Given the user picks the goal "Minecraft or LAN Party Game Server"
    When the user picks a standard desktop PC
    Then the engine should recommend "Ubuntu" (or "DietPi" on a Raspberry Pi or other low-power board)
    And the wizard should not ask about pro audio or desktop peripherals
    And the results should list "AMP (CubeCoders)" and "Minecraft Realms" only as paid alternatives with caveats
    And the legal notes should remind the user to follow each game's server terms, such as Minecraft's EULA and usage guidelines

  Scenario Outline: Communities with few resources can build their own network and services
    Given the user picks the goal "<goal>"
    And the device "<device>"
    When the evaluation completes
    Then the engine should recommend "<pick>"
    And the results should include the legal note "<note>"

    Examples:
      | goal                                  | device                        | pick                     | note                                            |
      | Community Wi-Fi or Village Internet   | Wi-Fi Router or Outdoor Radio | LibreMesh                | Stay within your country's radio limits         |
      | Community Wi-Fi or Village Internet   | Raspberry Pi                  | LibreMesh                | Check the rules for sharing internet access     |
      | Community Wi-Fi or Village Internet   | Standard Desktop PC           | OPNsense                 | Stay within your country's radio limits         |
      | Offline Library & Learning Server     | Raspberry Pi                  | Internet-in-a-Box (IIAB) | Mind the licence of each content pack           |

  Scenario: Community-network extras stay honest
    Given the user picks "Community Wi-Fi or Village Internet"
    Then "Splynx" should only appear as a paid alternative, priced per subscriber
    And the "Wi-Fi Router or Outdoor Radio" device should only be offered for network goals
    And specialist builds (LibreMesh, Internet-in-a-Box) should not win requests outside their specialty

  Scenario Outline: Remote and off-grid sites get systems that suit their power and connection
    Given the user is building a community or remote-site machine (community Wi-Fi, offline library, or a community server)
    When the wizard asks "How is this machine powered?" and the user answers "<power>"
    And the wizard asks "What internet connection does the site have?" and the user answers "<uplink>"
    Then a community server on a desktop PC should recommend "<pick>"

    Examples:
      | power                    | uplink                      | pick   |
      | Reliable Mains Power     | Reliable Broadband or Fibre | Ubuntu |
      | Solar Panel or Battery   | No Internet (Offline Site)  | DietPi |

  Scenario: Power and connection questions stay out of everyday flows
    Given the user is building a home server, desktop, or other non-community machine
    Then the wizard should not ask about power supply or the site's internet connection

  Scenario: Router and mesh results speak router, not desktop
    Given the top match is router firmware such as "LibreMesh" or "OpenWrt" on a "Wi-Fi Router or Outdoor Radio"
    Then the image card should explain installing the firmware for the exact router model from the router's own web interface
    And the results should not offer desktop apps or Docker add-ons
    And the hardware chip should read "Low-Power Hardware" rather than describing an old PC
