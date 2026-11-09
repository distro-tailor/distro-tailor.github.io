Feature: GPU-Specialized Workloads (AI, Data Science & Crypto Mining)
  As an AI developer, data scientist, or mining rig operator
  I want an operating system configured specifically for GPU acceleration
  So that I avoid DKMS kernel driver breakages and achieve maximum computing throughput

  Scenario: Setting up an AI & Local LLM Workstation
    Given the user selects use case "AI, LLM & GPU Compute"
    And the user specifies platform "Desktop Workstation"
    When the evaluation completes
    Then the engine should recommend "Pop!_OS (System76)" with a match score of at least 80%
    And the recommendation should highlight pre-baked NVIDIA drivers and CUDA support
    And the Mix & Match add-ons should provide 1-click commands for Ollama and PyTorch

  Scenario: Setting up a Headless Multi-GPU Mining Rig or Distributed Compute Node
    Given the user selects use case "AI, LLM & GPU Compute"
    And the user specifies platform "Headless Server"
    When the evaluation completes
    Then the engine should recommend "HiveOS"
    And the recommendation should highlight multi-GPU auto-detection (up to 12+ GPUs)
    And the recommendation should highlight automated thermal fan curves and hardware watchdog recovery
    And the recommendation should provide guidance for leasing idle compute to Akash or Render networks
