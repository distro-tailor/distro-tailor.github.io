import { FormFactor, PlatformTarget } from '@distro-tailor/core';

/** How a prebuilt image gets onto the target, shown on the turnkey image card. */
export const DEFAULT_FLASH_INSTRUCTIONS =
  'Download the official image directly. Includes universal out-of-the-box hardware drivers and pre-configured defaults—ready to flash in minutes with BalenaEtcher or Raspberry Pi Imager.';

export const FLASH_INSTRUCTIONS_BY_PLATFORM: Partial<Record<PlatformTarget, string>> = {
  'router-firewall':
    'Check that your exact router model is supported, then download the firmware built for it. Install it from the router\'s own web interface (or with sysupgrade on a router already running OpenWrt). Keep the original firmware file in case you need to go back.',
  microcontroller:
    'Build or download the firmware for your exact board, then flash it with the board vendor\'s tool or the project\'s flashing utility over USB.'
};

export const FLASH_INSTRUCTIONS_BY_FORM_FACTOR: Partial<Record<FormFactor, string>> = {
  chromebook:
    'Two routes. Easiest and reversible: turn on the Linux development environment in ChromeOS settings and install apps there, no flashing needed. To replace ChromeOS, check your model on mrchromebox.tech, flash its UEFI firmware (this means removing the write-protect), then install the image from a USB stick and run the community Chromebook audio script.'
};

export function getFlashInstructions(platform: PlatformTarget | undefined, formFactor?: FormFactor): string {
  return (
    (formFactor && FLASH_INSTRUCTIONS_BY_FORM_FACTOR[formFactor]) ||
    (platform && FLASH_INSTRUCTIONS_BY_PLATFORM[platform]) ||
    DEFAULT_FLASH_INSTRUCTIONS
  );
}
