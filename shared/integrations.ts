export type IntegrationCategory =
  | 'communication'
  | 'crm'
  | 'marketing'
  | 'social'
  | 'design'
  | 'development'
  | 'payments'
  | 'ecommerce'
  | 'analytics'
  | 'automation'
  | 'maps'
  | 'travel'
  | 'real_estate'
  | 'hr'
  | 'accounting';

export type IntegrationStatus = 'available' | 'connected' | 'disabled' | 'error';

export interface IntegrationFieldDef {
  key: string;
  label: string;
  type: 'text' | 'password' | 'url' | 'select';
  required: boolean;
  placeholder?: string;
  options?: Array<{ value: string; label: string }>;
  helpText?: string;
}

export interface IntegrationDef {
  id: string;
  name: string;
  category: IntegrationCategory;
  description: string;
  icon: string;
  /** Single emoji or short symbol used as a quick visual cue in the UI. */
  glyph: string;
  /** Material icon name to display inside the integration tile. */
  materialIcon: string;
  /** Capability tags the engine can match against (e.g. "send_email"). */
  capabilities: string[];
  /** Color tone to use in the UI tile (primary | emerald | indigo | violet | teal | rose | amber | slate). */
  tone: 'primary' | 'emerald' | 'indigo' | 'violet' | 'teal' | 'rose' | 'amber' | 'slate';
  /** Config fields required to connect. */
  fields: IntegrationFieldDef[];
  /** Whether this integration is bundled (always enabled) or per-company opt-in. */
  bundled?: boolean;
  /** Region / availability note (e.g. "India", "Global"). */
  region?: 'Global' | 'India' | 'US' | 'EU';
}

export interface IntegrationConnection {
  integrationId: string;
  companyId: string;
  status: IntegrationStatus;
  config: Record<string, string>;
  connectedAt: number;
  lastSyncedAt?: number;
  lastError?: string;
}

export const INTEGRATION_CATEGORIES: Array<{
  id: IntegrationCategory;
  label: string;
  icon: string;
  description: string;
}> = [
  { id: 'communication', label: 'Communication', icon: 'forum', description: 'Email, chat, messaging' },
  { id: 'crm', label: 'CRM', icon: 'contacts', description: 'Customer pipelines & deals' },
  { id: 'marketing', label: 'Marketing Ads', icon: 'campaign', description: 'Paid acquisition channels' },
  { id: 'social', label: 'Social', icon: 'share', description: 'Organic social platforms' },
  { id: 'design', label: 'Design', icon: 'palette', description: 'Design & creative tools' },
  { id: 'development', label: 'Development', icon: 'code', description: 'Code, deploy, infrastructure' },
  { id: 'payments', label: 'Payments', icon: 'credit_card', description: 'Collect & process payments' },
  { id: 'ecommerce', label: 'E-commerce', icon: 'storefront', description: 'Online stores & marketplaces' },
  { id: 'analytics', label: 'Analytics', icon: 'monitoring', description: 'Track behavior & funnels' },
  { id: 'automation', label: 'Automation', icon: 'bolt', description: 'Workflow & webhook automation' },
  { id: 'maps', label: 'Maps', icon: 'map', description: 'Maps, geo & location' },
  { id: 'travel', label: 'Travel', icon: 'flight', description: 'Travel & booking platforms' },
  { id: 'real_estate', label: 'Real Estate', icon: 'apartment', description: 'Listings & property platforms' },
  { id: 'hr', label: 'HR & Hiring', icon: 'badge', description: 'Jobs, payroll, hiring' },
  { id: 'accounting', label: 'Accounting', icon: 'receipt_long', description: 'Books, invoicing, tax' },
];

const T = {
  primary: 'primary',
  emerald: 'emerald',
  indigo: 'indigo',
  violet: 'violet',
  teal: 'teal',
  rose: 'rose',
  amber: 'amber',
  slate: 'slate',
} as const;

export const INTEGRATION_DEFS: IntegrationDef[] = [
  {
    id: 'whatsapp_business',
    name: 'WhatsApp Business',
    category: 'communication',
    description: 'Send customer updates, leads, and approvals via WhatsApp.',
    icon: 'whatsapp',
    glyph: '💬',
    materialIcon: 'chat',
    capabilities: ['send_message', 'send_template', 'receive_message'],
    tone: 'emerald',
    region: 'Global',
    fields: [
      { key: 'phoneNumberId', label: 'Phone Number ID', type: 'text', required: true },
      { key: 'accessToken', label: 'Access Token', type: 'password', required: true },
      { key: 'businessId', label: 'WhatsApp Business ID', type: 'text', required: true },
    ],
  },
  {
    id: 'telegram',
    name: 'Telegram',
    category: 'communication',
    description: 'Bot-driven updates and alerts to Telegram channels.',
    icon: 'telegram',
    glyph: '✈️',
    materialIcon: 'send',
    capabilities: ['send_message', 'bot_commands'],
    tone: 'indigo',
    region: 'Global',
    fields: [
      { key: 'botToken', label: 'Bot Token', type: 'password', required: true },
      { key: 'chatId', label: 'Default Chat ID', type: 'text', required: false },
    ],
  },
  {
    id: 'slack',
    name: 'Slack',
    category: 'communication',
    description: 'Channel updates, approvals, and team hand-offs.',
    icon: 'slack',
    glyph: '💼',
    materialIcon: 'tag',
    capabilities: ['send_message', 'channel_post', 'interactive_actions'],
    tone: 'violet',
    region: 'Global',
    fields: [
      { key: 'workspace', label: 'Workspace Subdomain', type: 'text', required: true, placeholder: 'acme' },
      { key: 'botToken', label: 'Bot User OAuth Token', type: 'password', required: true },
    ],
  },
  {
    id: 'discord',
    name: 'Discord',
    category: 'communication',
    description: 'Server channels, DMs, and bot commands.',
    icon: 'discord',
    glyph: '🎮',
    materialIcon: 'forum',
    capabilities: ['send_message', 'webhook'],
    tone: 'indigo',
    region: 'Global',
    fields: [
      { key: 'webhookUrl', label: 'Webhook URL', type: 'url', required: true },
    ],
  },
  {
    id: 'gmail',
    name: 'Gmail',
    category: 'communication',
    description: 'Send transactional + outreach emails from your domain.',
    icon: 'gmail',
    glyph: '📧',
    materialIcon: 'mail',
    capabilities: ['send_email', 'read_inbox', 'create_draft'],
    tone: 'rose',
    region: 'Global',
    fields: [
      { key: 'oauthClientId', label: 'OAuth Client ID', type: 'text', required: true },
      { key: 'oauthClientSecret', label: 'OAuth Client Secret', type: 'password', required: true },
    ],
  },
  {
    id: 'outlook',
    name: 'Outlook 365',
    category: 'communication',
    description: 'Microsoft 365 email + calendar integration.',
    icon: 'outlook',
    glyph: '📨',
    materialIcon: 'mail',
    capabilities: ['send_email', 'create_event'],
    tone: 'indigo',
    region: 'Global',
    fields: [
      { key: 'tenantId', label: 'Azure Tenant ID', type: 'text', required: true },
      { key: 'clientId', label: 'Azure Client ID', type: 'text', required: true },
      { key: 'clientSecret', label: 'Client Secret', type: 'password', required: true },
    ],
  },

  {
    id: 'hubspot',
    name: 'HubSpot',
    category: 'crm',
    description: 'Pipelines, deals, contacts synced to your CRM.',
    icon: 'hubspot',
    glyph: '🧲',
    materialIcon: 'contact_mail',
    capabilities: ['contacts', 'deals', 'pipelines'],
    tone: 'rose',
    region: 'Global',
    fields: [
      { key: 'accessToken', label: 'Private App Token', type: 'password', required: true },
    ],
  },
  {
    id: 'salesforce',
    name: 'Salesforce',
    category: 'crm',
    description: 'Enterprise CRM with full opportunity tracking.',
    icon: 'salesforce',
    glyph: '☁️',
    materialIcon: 'cloud',
    capabilities: ['contacts', 'opportunities', 'leads', 'reports'],
    tone: 'indigo',
    region: 'Global',
    fields: [
      { key: 'instanceUrl', label: 'Instance URL', type: 'url', required: true, placeholder: 'https://acme.my.salesforce.com' },
      { key: 'clientId', label: 'Consumer Key', type: 'text', required: true },
      { key: 'clientSecret', label: 'Consumer Secret', type: 'password', required: true },
    ],
  },
  {
    id: 'zoho_crm',
    name: 'Zoho CRM',
    category: 'crm',
    description: 'Mid-market CRM with strong India presence.',
    icon: 'zoho',
    glyph: '🟧',
    materialIcon: 'workspaces',
    capabilities: ['contacts', 'deals', 'pipelines'],
    tone: 'amber',
    region: 'India',
    fields: [
      { key: 'region', label: 'Data Center', type: 'select', required: true, options: [
        { value: 'com', label: 'zoho.com (Global)' },
        { value: 'eu', label: 'zoho.eu (Europe)' },
        { value: 'in', label: 'zoho.in (India)' },
      ] },
      { key: 'clientId', label: 'Client ID', type: 'text', required: true },
      { key: 'clientSecret', label: 'Client Secret', type: 'password', required: true },
    ],
  },

  {
    id: 'meta_ads',
    name: 'Meta Ads',
    category: 'marketing',
    description: 'Run Facebook + Instagram ad campaigns.',
    icon: 'meta',
    glyph: '📣',
    materialIcon: 'campaign',
    capabilities: ['campaigns', 'adsets', 'creatives', 'insights'],
    tone: 'indigo',
    region: 'Global',
    fields: [
      { key: 'adAccountId', label: 'Ad Account ID', type: 'text', required: true },
      { key: 'accessToken', label: 'System User Token', type: 'password', required: true },
    ],
  },
  {
    id: 'google_ads',
    name: 'Google Ads',
    category: 'marketing',
    description: 'Search, Display, YouTube ad campaigns.',
    icon: 'google_ads',
    glyph: '🎯',
    materialIcon: 'ads_click',
    capabilities: ['campaigns', 'keywords', 'conversions'],
    tone: 'amber',
    region: 'Global',
    fields: [
      { key: 'developerToken', label: 'Developer Token', type: 'password', required: true },
      { key: 'clientId', label: 'OAuth Client ID', type: 'text', required: true },
      { key: 'clientSecret', label: 'OAuth Client Secret', type: 'password', required: true },
    ],
  },
  {
    id: 'linkedin_ads',
    name: 'LinkedIn Ads',
    category: 'marketing',
    description: 'B2B lead gen and sponsored content.',
    icon: 'linkedin_ads',
    glyph: '💼',
    materialIcon: 'work',
    capabilities: ['campaigns', 'lead_forms', 'insights'],
    tone: 'indigo',
    region: 'Global',
    fields: [
      { key: 'adAccountUrn', label: 'Ad Account URN', type: 'text', required: true },
      { key: 'accessToken', label: 'Access Token', type: 'password', required: true },
    ],
  },

  {
    id: 'instagram',
    name: 'Instagram',
    category: 'social',
    description: 'Schedule posts, stories, and reels.',
    icon: 'instagram',
    glyph: '📸',
    materialIcon: 'photo_camera',
    capabilities: ['publish_post', 'publish_story', 'comments', 'insights'],
    tone: 'rose',
    region: 'Global',
    fields: [
      { key: 'businessAccountId', label: 'Business Account ID', type: 'text', required: true },
      { key: 'accessToken', label: 'Page Access Token', type: 'password', required: true },
    ],
  },
  {
    id: 'facebook',
    name: 'Facebook Pages',
    category: 'social',
    description: 'Page posts, comments, and messenger.',
    icon: 'facebook',
    glyph: '👍',
    materialIcon: 'thumb_up',
    capabilities: ['publish_post', 'comments', 'messenger'],
    tone: 'indigo',
    region: 'Global',
    fields: [
      { key: 'pageId', label: 'Page ID', type: 'text', required: true },
      { key: 'accessToken', label: 'Page Access Token', type: 'password', required: true },
    ],
  },
  {
    id: 'linkedin_pages',
    name: 'LinkedIn Pages',
    category: 'social',
    description: 'Company page posts and engagement.',
    icon: 'linkedin',
    glyph: '🟦',
    materialIcon: 'work_outline',
    capabilities: ['publish_post', 'comments'],
    tone: 'indigo',
    region: 'Global',
    fields: [
      { key: 'organizationUrn', label: 'Organization URN', type: 'text', required: true },
      { key: 'accessToken', label: 'Access Token', type: 'password', required: true },
    ],
  },
  {
    id: 'youtube',
    name: 'YouTube',
    category: 'social',
    description: 'Upload videos and pull channel analytics.',
    icon: 'youtube',
    glyph: '▶️',
    materialIcon: 'play_circle',
    capabilities: ['upload_video', 'channel_stats'],
    tone: 'rose',
    region: 'Global',
    fields: [
      { key: 'channelId', label: 'Channel ID', type: 'text', required: true },
      { key: 'apiKey', label: 'API Key', type: 'password', required: true },
    ],
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    category: 'social',
    description: 'Publish short-form videos and track views.',
    icon: 'tiktok',
    glyph: '🎵',
    materialIcon: 'music_note',
    capabilities: ['publish_video', 'creator_insights'],
    tone: 'slate',
    region: 'Global',
    fields: [
      { key: 'openId', label: 'Open ID', type: 'text', required: true },
      { key: 'accessToken', label: 'Access Token', type: 'password', required: true },
    ],
  },

  {
    id: 'canva',
    name: 'Canva',
    category: 'design',
    description: 'Generate branded social + marketing visuals.',
    icon: 'canva',
    glyph: '🎨',
    materialIcon: 'palette',
    capabilities: ['export_design', 'autofill_brand'],
    tone: 'indigo',
    region: 'Global',
    fields: [
      { key: 'apiKey', label: 'Connect API Key', type: 'password', required: true },
      { key: 'brandKitId', label: 'Brand Kit ID', type: 'text', required: false },
    ],
  },
  {
    id: 'figma',
    name: 'Figma',
    category: 'design',
    description: 'Sync design files and component libraries.',
    icon: 'figma',
    glyph: '🟣',
    materialIcon: 'design_services',
    capabilities: ['read_file', 'export_components'],
    tone: 'violet',
    region: 'Global',
    fields: [
      { key: 'accessToken', label: 'Personal Access Token', type: 'password', required: true },
      { key: 'teamId', label: 'Team ID', type: 'text', required: false },
    ],
  },

  {
    id: 'github',
    name: 'GitHub',
    category: 'development',
    description: 'Code repos, issues, and PRs.',
    icon: 'github',
    glyph: '🐙',
    materialIcon: 'code',
    capabilities: ['create_issue', 'open_pr', 'read_repo'],
    tone: 'slate',
    region: 'Global',
    fields: [
      { key: 'org', label: 'Organization', type: 'text', required: true },
      { key: 'token', label: 'Personal Access Token', type: 'password', required: true },
    ],
  },
  {
    id: 'vercel',
    name: 'Vercel',
    category: 'development',
    description: 'Deploy web apps from the engine.',
    icon: 'vercel',
    glyph: '▲',
    materialIcon: 'rocket_launch',
    capabilities: ['deploy_project', 'list_domains'],
    tone: 'slate',
    region: 'Global',
    fields: [
      { key: 'teamId', label: 'Team ID', type: 'text', required: false },
      { key: 'token', label: 'API Token', type: 'password', required: true },
    ],
  },
  {
    id: 'supabase',
    name: 'Supabase',
    category: 'development',
    description: 'Postgres + auth + storage.',
    icon: 'supabase',
    glyph: '⚡',
    materialIcon: 'storage',
    capabilities: ['database', 'auth', 'storage'],
    tone: 'emerald',
    region: 'Global',
    fields: [
      { key: 'projectUrl', label: 'Project URL', type: 'url', required: true },
      { key: 'anonKey', label: 'Anon Public Key', type: 'password', required: true },
      { key: 'serviceKey', label: 'Service Role Key', type: 'password', required: true },
    ],
  },
  {
    id: 'firebase',
    name: 'Firebase',
    category: 'development',
    description: 'Google mobile + web app platform.',
    icon: 'firebase',
    glyph: '🔥',
    materialIcon: 'local_fire_department',
    capabilities: ['database', 'auth', 'functions'],
    tone: 'amber',
    region: 'Global',
    fields: [
      { key: 'projectId', label: 'Project ID', type: 'text', required: true },
      { key: 'serviceAccount', label: 'Service Account JSON', type: 'password', required: true },
    ],
  },

  {
    id: 'stripe',
    name: 'Stripe',
    category: 'payments',
    description: 'Accept card payments worldwide.',
    icon: 'stripe',
    glyph: '💳',
    materialIcon: 'credit_card',
    capabilities: ['charge', 'subscriptions', 'invoices'],
    tone: 'indigo',
    region: 'Global',
    fields: [
      { key: 'secretKey', label: 'Secret Key', type: 'password', required: true },
      { key: 'webhookSecret', label: 'Webhook Signing Secret', type: 'password', required: false },
    ],
  },
  {
    id: 'razorpay',
    name: 'Razorpay',
    category: 'payments',
    description: 'India payments, UPI, cards, netbanking.',
    icon: 'razorpay',
    glyph: '🟢',
    materialIcon: 'account_balance',
    capabilities: ['charge', 'subscriptions', 'invoices', 'upi'],
    tone: 'indigo',
    region: 'India',
    fields: [
      { key: 'keyId', label: 'Key ID', type: 'text', required: true },
      { key: 'keySecret', label: 'Key Secret', type: 'password', required: true },
    ],
  },
  {
    id: 'paypal',
    name: 'PayPal',
    category: 'payments',
    description: 'Cross-border PayPal payments.',
    icon: 'paypal',
    glyph: '🅿️',
    materialIcon: 'payments',
    capabilities: ['charge', 'subscriptions', 'payouts'],
    tone: 'indigo',
    region: 'Global',
    fields: [
      { key: 'clientId', label: 'Client ID', type: 'text', required: true },
      { key: 'secret', label: 'Secret', type: 'password', required: true },
    ],
  },

  {
    id: 'shopify',
    name: 'Shopify',
    category: 'ecommerce',
    description: 'Sync products, orders, and inventory.',
    icon: 'shopify',
    glyph: '🛍️',
    materialIcon: 'shopping_bag',
    capabilities: ['products', 'orders', 'inventory'],
    tone: 'emerald',
    region: 'Global',
    fields: [
      { key: 'shop', label: 'Store Subdomain', type: 'text', required: true, placeholder: 'acme' },
      { key: 'accessToken', label: 'Admin API Token', type: 'password', required: true },
    ],
  },
  {
    id: 'woocommerce',
    name: 'WooCommerce',
    category: 'ecommerce',
    description: 'WordPress + WooCommerce stores.',
    icon: 'woocommerce',
    glyph: '🟪',
    materialIcon: 'shopping_cart',
    capabilities: ['products', 'orders', 'customers'],
    tone: 'violet',
    region: 'Global',
    fields: [
      { key: 'siteUrl', label: 'Site URL', type: 'url', required: true },
      { key: 'consumerKey', label: 'Consumer Key', type: 'text', required: true },
      { key: 'consumerSecret', label: 'Consumer Secret', type: 'password', required: true },
    ],
  },
  {
    id: 'amazon_seller',
    name: 'Amazon Seller',
    category: 'ecommerce',
    description: 'Amazon SP-API for orders, inventory, ads.',
    icon: 'amazon',
    glyph: '📦',
    materialIcon: 'inventory',
    capabilities: ['orders', 'inventory', 'ads'],
    tone: 'amber',
    region: 'Global',
    fields: [
      { key: 'sellerId', label: 'Seller ID', type: 'text', required: true },
      { key: 'refreshToken', label: 'LWA Refresh Token', type: 'password', required: true },
    ],
  },

  {
    id: 'google_analytics',
    name: 'Google Analytics',
    category: 'analytics',
    description: 'GA4 traffic, events, conversions.',
    icon: 'google_analytics',
    glyph: '📊',
    materialIcon: 'monitoring',
    capabilities: ['read_reports', 'events'],
    tone: 'amber',
    region: 'Global',
    fields: [
      { key: 'propertyId', label: 'GA4 Property ID', type: 'text', required: true },
      { key: 'serviceAccount', label: 'Service Account JSON', type: 'password', required: true },
    ],
  },
  {
    id: 'posthog',
    name: 'PostHog',
    category: 'analytics',
    description: 'Product analytics with session replay.',
    icon: 'posthog',
    glyph: '🦔',
    materialIcon: 'insights',
    capabilities: ['events', 'feature_flags', 'session_replay'],
    tone: 'amber',
    region: 'Global',
    fields: [
      { key: 'projectApiKey', label: 'Project API Key', type: 'text', required: true },
      { key: 'host', label: 'Host', type: 'url', required: false, placeholder: 'https://us.i.posthog.com' },
    ],
  },
  {
    id: 'mixpanel',
    name: 'Mixpanel',
    category: 'analytics',
    description: 'Event tracking and funnels.',
    icon: 'mixpanel',
    glyph: '🟣',
    materialIcon: 'donut_small',
    capabilities: ['events', 'funnels', 'cohorts'],
    tone: 'violet',
    region: 'Global',
    fields: [
      { key: 'projectToken', label: 'Project Token', type: 'password', required: true },
    ],
  },

  {
    id: 'n8n',
    name: 'n8n',
    category: 'automation',
    description: 'Self-hostable workflow automation.',
    icon: 'n8n',
    glyph: '🔁',
    materialIcon: 'sync',
    capabilities: ['webhook', 'workflow_run'],
    tone: 'rose',
    region: 'Global',
    fields: [
      { key: 'baseUrl', label: 'n8n Base URL', type: 'url', required: true },
      { key: 'apiKey', label: 'API Key', type: 'password', required: true },
    ],
  },
  {
    id: 'make',
    name: 'Make',
    category: 'automation',
    description: 'Visual scenario automation (Integromat).',
    icon: 'make',
    glyph: '🟪',
    materialIcon: 'auto_awesome_motion',
    capabilities: ['webhook', 'scenario_run'],
    tone: 'violet',
    region: 'Global',
    fields: [
      { key: 'apiKey', label: 'API Key', type: 'password', required: true },
    ],
  },
  {
    id: 'zapier',
    name: 'Zapier',
    category: 'automation',
    description: 'Connect 5000+ apps via Zaps.',
    icon: 'zapier',
    glyph: '⚡',
    materialIcon: 'flash_on',
    capabilities: ['webhook', 'zap_run'],
    tone: 'amber',
    region: 'Global',
    fields: [
      { key: 'webhookUrl', label: 'Catch Hook URL', type: 'url', required: true },
    ],
  },

  {
    id: 'google_maps',
    name: 'Google Maps',
    category: 'maps',
    description: 'Place search, geocoding, directions.',
    icon: 'google_maps',
    glyph: '🗺️',
    materialIcon: 'map',
    capabilities: ['geocode', 'place_search', 'directions'],
    tone: 'emerald',
    region: 'Global',
    fields: [
      { key: 'apiKey', label: 'Maps API Key', type: 'password', required: true },
    ],
  },

  {
    id: 'makemytrip',
    name: 'MakeMyTrip',
    category: 'travel',
    description: 'Travel booking inventory (B2B API).',
    icon: 'makemytrip',
    glyph: '🛫',
    materialIcon: 'flight',
    capabilities: ['search_inventory'],
    tone: 'rose',
    region: 'India',
    fields: [
      { key: 'username', label: 'API Username', type: 'text', required: true },
      { key: 'password', label: 'API Password', type: 'password', required: true },
    ],
  },
  {
    id: 'goibibo',
    name: 'Goibibo',
    category: 'travel',
    description: 'Hotel + flight inventory via partners.',
    icon: 'goibibo',
    glyph: '🏨',
    materialIcon: 'hotel',
    capabilities: ['search_inventory'],
    tone: 'rose',
    region: 'India',
    fields: [
      { key: 'apiKey', label: 'API Key', type: 'password', required: true },
    ],
  },

  {
    id: '99acres',
    name: '99acres',
    category: 'real_estate',
    description: 'India property listings + leads.',
    icon: '99acres',
    glyph: '🏘️',
    materialIcon: 'apartment',
    capabilities: ['listings', 'leads'],
    tone: 'amber',
    region: 'India',
    fields: [
      { key: 'apiKey', label: 'Partner API Key', type: 'password', required: true },
    ],
  },
  {
    id: 'magicbricks',
    name: 'MagicBricks',
    category: 'real_estate',
    description: 'India property listings + listings API.',
    icon: 'magicbricks',
    glyph: '🪄',
    materialIcon: 'home_work',
    capabilities: ['listings', 'leads'],
    tone: 'rose',
    region: 'India',
    fields: [
      { key: 'apiKey', label: 'Partner API Key', type: 'password', required: true },
    ],
  },
  {
    id: 'housing',
    name: 'Housing.com',
    category: 'real_estate',
    description: 'India property listings.',
    icon: 'housing',
    glyph: '🏠',
    materialIcon: 'house',
    capabilities: ['listings', 'leads'],
    tone: 'indigo',
    region: 'India',
    fields: [
      { key: 'apiKey', label: 'Partner API Key', type: 'password', required: true },
    ],
  },

  {
    id: 'linkedin_jobs',
    name: 'LinkedIn Jobs',
    category: 'hr',
    description: 'Post jobs and receive applicants.',
    icon: 'linkedin_jobs',
    glyph: '💼',
    materialIcon: 'work_outline',
    capabilities: ['post_job', 'list_applicants'],
    tone: 'indigo',
    region: 'Global',
    fields: [
      { key: 'accessToken', label: 'API Token', type: 'password', required: true },
    ],
  },
  {
    id: 'indeed',
    name: 'Indeed',
    category: 'hr',
    description: 'Post jobs and parse resumes.',
    icon: 'indeed',
    glyph: '🟦',
    materialIcon: 'badge',
    capabilities: ['post_job'],
    tone: 'indigo',
    region: 'Global',
    fields: [
      { key: 'apiKey', label: 'API Key', type: 'password', required: true },
    ],
  },
  {
    id: 'naukri',
    name: 'Naukri',
    category: 'hr',
    description: 'India #1 job portal.',
    icon: 'naukri',
    glyph: '🟧',
    materialIcon: 'badge',
    capabilities: ['post_job', 'search_resume'],
    tone: 'amber',
    region: 'India',
    fields: [
      { key: 'clientId', label: 'Client ID', type: 'text', required: true },
      { key: 'apiKey', label: 'API Key', type: 'password', required: true },
    ],
  },

  {
    id: 'zoho_books',
    name: 'Zoho Books',
    category: 'accounting',
    description: 'Cloud accounting + GST (India).',
    icon: 'zoho_books',
    glyph: '📒',
    materialIcon: 'menu_book',
    capabilities: ['invoices', 'expenses', 'reports'],
    tone: 'amber',
    region: 'India',
    fields: [
      { key: 'orgId', label: 'Organization ID', type: 'text', required: true },
      { key: 'accessToken', label: 'Access Token', type: 'password', required: true },
    ],
  },
  {
    id: 'quickbooks',
    name: 'QuickBooks',
    category: 'accounting',
    description: 'Small business accounting.',
    icon: 'quickbooks',
    glyph: '🟢',
    materialIcon: 'receipt_long',
    capabilities: ['invoices', 'expenses', 'reports'],
    tone: 'emerald',
    region: 'US',
    fields: [
      { key: 'realmId', label: 'Realm / Company ID', type: 'text', required: true },
      { key: 'accessToken', label: 'Access Token', type: 'password', required: true },
    ],
  },
  {
    id: 'tally',
    name: 'Tally',
    category: 'accounting',
    description: 'India desktop + TallyPrime accounting.',
    icon: 'tally',
    glyph: '🔢',
    materialIcon: 'calculate',
    capabilities: ['vouchers', 'reports', 'gst'],
    tone: 'indigo',
    region: 'India',
    fields: [
      { key: 'server', label: 'Tally Server URL', type: 'url', required: true },
      { key: 'company', label: 'Company Name', type: 'text', required: true },
    ],
  },
];

export function getIntegrationDef(id: string): IntegrationDef | undefined {
  return INTEGRATION_DEFS.find((i) => i.id === id);
}

export function integrationsForCategory(category: IntegrationCategory): IntegrationDef[] {
  return INTEGRATION_DEFS.filter((i) => i.category === category);
}
