/// <reference types="vite/client" />

interface ImportMetaEnv {
  /**
   * Disable email gate for development/testing
   * Set to 'true' to bypass email collection modal
   */
  readonly VITE_DISABLE_EMAIL_GATE?: string;

  /**
   * Beehiiv embed form action URL
   * Example: https://embeds.beehiiv.com/YOUR_EMBED_ID
   * If not set, email will only be stored locally
   */
  readonly VITE_BEEHIIV_EMBED_ACTION?: string;

  /**
   * Beehiiv publication ID
   * Required when using Beehiiv integration
   * If not set, email will only be stored locally
   */
  readonly VITE_BEEHIIV_PUBLICATION_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
