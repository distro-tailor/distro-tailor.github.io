Feature: Hardware Targeting & Driver/Firmware Bloat Pruning
  As a Linux builder or hobbyist
  I want DistroTailor to tailor drivers, kernel modules, and firmware specifically to my target hardware
  So that I eliminate up to 90% of generic distribution bloat and achieve sub-3-second cold boots

  Background:
    Given generic Linux distributions ship over 1.8GB of firmware and 4,500+ kernel drivers
    And the user specifies their exact target hardware architecture and platform

  Scenario: Repurposing an old Intel MacBook (2006–2017)
    Given the user specifies device "Old Intel MacBook / Mac (2006–2017)"
    When the recipe is generated
    Then the recipe should include support for proprietary Broadcom Wi-Fi ("bcmwl-kernel-source")
    And the bootloader configuration should support 32-bit and 64-bit EFI stubs ("grub-efi-ia32-bin")
    And the system should avoid unneeded ARM and non-Apple firmware blobs

  Scenario: Repurposing a cheap Android TV Box or TV Stick (Amlogic / Allwinner / Rockchip)
    Given the user specifies device "Android TV Box or TV Stick (Amlogic, Allwinner, Rockchip)"
    And the user specifies goal "Home Server & Private Cloud"
    When the evaluation completes
    Then the engine should recommend "Armbian" with ARM64 architecture support
    And the recommendation should highlight low 3W–5W idle power draw
    And the guide should explain copying the matching Device Tree Blob (".dtb")

  Scenario: Reclaiming abandoned consumer gadgets (Synology NAS, Old Phone, Ouya)
    Given the user specifies device "Repurposed Gadget (Synology NAS, Old Phone, Ouya, Thin Client)"
    When the evaluation is performed
    Then the system should evaluate "postmarketOS", "OpenMediaVault", and "Armbian"
    And if an old smartphone is targeted, the system should highlight using the internal battery as a built-in UPS

  Scenario: Zero-Bloat Hardware Optimization comparison display
    Given a user completes their questionnaire
    When the Results page renders
    Then a "Zero-Bloat Hardware Optimization" card must be displayed
    And it must clearly clarify that official prebuilt ISOs still carry upstream generic bloat
    And it must indicate that the ~92% bloat reduction is achieved via the Custom Makefile Recipe Generator
    And it must show side-by-side metrics comparing a ~4.5GB generic distribution with a ~200MB tailored build
    And it must quantify firmware blob reduction, idle RAM reduction, and cold boot duration

  Scenario: The PCPartPicker Modular Rig vs Fixed Closed Hardware Bloat Contrast
    Given a user compares building a modular DIY PC on PCPartPicker vs using a fixed MacBook or Mac Studio
    When inspecting the Bloat Checker
    Then the system highlights that fixed hardware has 100% deterministic silicon where generic drivers are 99% waste
    And highlights that modular PCPartPicker rigs only use 1 NIC, 1 Wi-Fi, and 1 GPU out of thousands bundled in generic ISOs
    And the generated build recipe includes "make detect-hardware" to scan active PCI/USB inventory and prune unused blobs

  Scenario: Repurposing a Craigslist enterprise server rack (Dell PowerEdge / HP ProLiant / Supermicro)
    Given the user specifies device "Used Enterprise Rack Server (Craigslist / eBay 1U/2U/4U)"
    And the user selects goal "Homelab Virtualization & Hypervisor Host"
    When the evaluation completes
    Then the engine should recommend "Proxmox Virtual Environment (PVE)" with 100% compatibility
    And the recommendation should feature IPMI fan silencing scripts ("ipmitool") and Ceph clustering
    And for multi-bay storage arrays, it should suggest "TrueNAS SCALE" with IT-mode HBA flashing guides
