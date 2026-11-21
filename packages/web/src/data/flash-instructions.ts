import { PlatformTarget } from '@distro-tailor/core';

/** How a prebuilt image gets onto the target, shown on the turnkey image card. */
export const DEFAULT_FLASH_INSTRUCTIONS =
  'Download the official image directly. Includes universal out-of-the-box hardware drivers and pre-configured defaults—ready to flash in minutes with BalenaEtcher or Raspberry Pi Imager.';

export const FLASH_INSTRUCTIONS_BY_PLATFORM: Partial<Record<PlatformTarget, string>> = {
  'router-firewall':
    'Check that your exact router model is supported, then download the firmware built for it. Install it from the router\'s own web interface (or with sysupgrade on a router already running OpenWrt). Keep the original firmware file in case you need to go back.',
  microcontroller:
    'Build or download the firmware for your exact board, then flash it with the board vendor\'s tool or the project\'s flashing utility over USB.'
};

export function getFlashInstructions(platform: PlatformTarget | undefined): string {
  return (platform && FLASH_INSTRUCTIONS_BY_PLATFORM[platform]) || DEFAULT_FLASH_INSTRUCTIONS;
}
