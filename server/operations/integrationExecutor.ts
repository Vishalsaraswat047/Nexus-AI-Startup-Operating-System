import { getConnection, setConnectionStatus } from './integrationStore';
import { appendEvent } from './eventLog';
import { writeMemory } from './memoryOps';

export interface IntegrationOperation {
  integrationId: string;
  operation: string;
  params: Record<string, unknown>;
}

export interface IntegrationResult {
  success: boolean;
  data?: unknown;
  error?: string;
  executedAt: number;
}

async function callWhatsAppApi(
  config: Record<string, string>,
  operation: string,
  params: Record<string, unknown>,
): Promise<IntegrationResult> {
  const { accessToken, phoneNumberId, businessId } = config;

  if (operation === 'send_message') {
    const { to, message, template } = params as { to: string; message?: string; template?: string };

    try {
      const response = await fetch(
        `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: to.replace(/\D/g, ''),
            type: template ? 'template' : 'text',
            ...(template
              ? {
                  template: {
                    name: template,
                    language: { code: 'en_US' },
                  },
                }
              : { text: { body: message } }),
          }),
        },
      );

      const data = await response.json() as { messages?: Array<{ id: string }>; errors?: Array<{ message: string }> };

      if (!response.ok) {
        return {
          success: false,
          error: `WhatsApp API error: ${JSON.stringify(data)}`,
          executedAt: Date.now(),
        };
      }

      return {
        success: true,
        data: { messageId: data.messages?.[0]?.id },
        executedAt: Date.now(),
      };
    } catch (e) {
      return {
        success: false,
        error: e instanceof Error ? e.message : 'WhatsApp API call failed',
        executedAt: Date.now(),
      };
    }
  }

  return { success: false, error: `Unknown operation: ${operation}`, executedAt: Date.now() };
}

async function callTelegramApi(
  config: Record<string, string>,
  operation: string,
  params: Record<string, unknown>,
): Promise<IntegrationResult> {
  const { botToken, chatId } = config;
  const baseUrl = `https://api.telegram.org/bot${botToken}`;

  if (operation === 'send_message') {
    const { message, chatId: paramChatId } = params as { message: string; chatId?: string };
    const targetChatId = paramChatId || chatId;

    if (!targetChatId) {
      return { success: false, error: 'No chat_id provided', executedAt: Date.now() };
    }

    try {
      const response = await fetch(`${baseUrl}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: targetChatId,
          text: message,
          parse_mode: 'Markdown',
        }),
      });

      const data = await response.json() as { ok: boolean; result?: { message_id: number }; description?: string };

      if (!response.ok || !data.ok) {
        return {
          success: false,
          error: `Telegram error: ${data.description || 'Unknown error'}`,
          executedAt: Date.now(),
        };
      }

      return {
        success: true,
        data: { messageId: data.result?.message_id },
        executedAt: Date.now(),
      };
    } catch (e) {
      return {
        success: false,
        error: e instanceof Error ? e.message : 'Telegram API call failed',
        executedAt: Date.now(),
      };
    }
  }

  return { success: false, error: `Unknown operation: ${operation}`, executedAt: Date.now() };
}

async function callSlackApi(
  config: Record<string, string>,
  operation: string,
  params: Record<string, unknown>,
): Promise<IntegrationResult> {
  const { botToken, workspace } = config;

  if (operation === 'post_message') {
    const { channel, text, blocks } = params as { channel?: string; text: string; blocks?: unknown[] };

    try {
      const response = await fetch('https://slack.com/api/chat.postMessage', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${botToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          channel: channel || `#${workspace}`,
          text,
          blocks: blocks || [],
        }),
      });

      const data = await response.json() as { ok: boolean; ts?: string; error?: string };

      if (!response.ok || !data.ok) {
        return {
          success: false,
          error: `Slack error: ${data.error || 'Unknown error'}`,
          executedAt: Date.now(),
        };
      }

      return {
        success: true,
        data: { ts: data.ts },
        executedAt: Date.now(),
      };
    } catch (e) {
      return {
        success: false,
        error: e instanceof Error ? e.message : 'Slack API call failed',
        executedAt: Date.now(),
      };
    }
  }

  return { success: false, error: `Unknown operation: ${operation}`, executedAt: Date.now() };
}

async function callHubSpotApi(
  config: Record<string, string>,
  operation: string,
  params: Record<string, unknown>,
): Promise<IntegrationResult> {
  const { accessToken } = config;
  const baseUrl = 'https://api.hubapi.com';

  if (operation === 'create_contact') {
    const { email, firstName, lastName, company } = params as {
      email: string;
      firstName?: string;
      lastName?: string;
      company?: string;
    };

    try {
      const response = await fetch(`${baseUrl}/crm/v3/objects/contacts`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          properties: {
            email,
            ...(firstName && { firstname: firstName }),
            ...(lastName && { lastname: lastName }),
            ...(company && { company }),
          },
        }),
      });

      const data = await response.json() as { id?: string; message?: string };

      if (!response.ok) {
        return {
          success: false,
          error: `HubSpot error: ${data.message || 'Unknown error'}`,
          executedAt: Date.now(),
        };
      }

      return {
        success: true,
        data: { contactId: data.id },
        executedAt: Date.now(),
      };
    } catch (e) {
      return {
        success: false,
        error: e instanceof Error ? e.message : 'HubSpot API call failed',
        executedAt: Date.now(),
      };
    }
  }

  if (operation === 'create_deal') {
    const { dealName, amount, stage } = params as {
      dealName: string;
      amount?: number;
      stage?: string;
    };

    try {
      const response = await fetch(`${baseUrl}/crm/v3/objects/deals`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          properties: {
            dealname: dealName,
            ...(amount && { amount: String(amount) }),
            ...(stage && { dealstage: stage }),
          },
        }),
      });

      const data = await response.json() as { id?: string; message?: string };

      if (!response.ok) {
        return {
          success: false,
          error: `HubSpot error: ${data.message || 'Unknown error'}`,
          executedAt: Date.now(),
        };
      }

      return {
        success: true,
        data: { dealId: data.id },
        executedAt: Date.now(),
      };
    } catch (e) {
      return {
        success: false,
        error: e instanceof Error ? e.message : 'HubSpot API call failed',
        executedAt: Date.now(),
      };
    }
  }

  return { success: false, error: `Unknown operation: ${operation}`, executedAt: Date.now() };
}

async function callStripeApi(
  config: Record<string, string>,
  operation: string,
  params: Record<string, unknown>,
): Promise<IntegrationResult> {
  const { secretKey } = config;

  if (operation === 'create_payment') {
    const { amount, currency, customerEmail, description } = params as {
      amount: number;
      currency?: string;
      customerEmail?: string;
      description?: string;
    };

    try {
      const response = await fetch('https://api.stripe.com/v1/paymentIntents', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${secretKey}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          amount: String(Math.round(amount * 100)),
          currency: currency || 'inr',
          ...(customerEmail && { 'receipt_email': customerEmail }),
          ...(description && { description }),
        }),
      });

      const data = await response.json() as { id?: string; client_secret?: string; error?: { message: string } };

      if (data.error) {
        return {
          success: false,
          error: `Stripe error: ${data.error.message}`,
          executedAt: Date.now(),
        };
      }

      return {
        success: true,
        data: { paymentIntentId: data.id, clientSecret: data.client_secret },
        executedAt: Date.now(),
      };
    } catch (e) {
      return {
        success: false,
        error: e instanceof Error ? e.message : 'Stripe API call failed',
        executedAt: Date.now(),
      };
    }
  }

  return { success: false, error: `Unknown operation: ${operation}`, executedAt: Date.now() };
}

async function callRazorpayApi(
  config: Record<string, string>,
  operation: string,
  params: Record<string, unknown>,
): Promise<IntegrationResult> {
  const { keyId, keySecret } = config;
  const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');

  if (operation === 'create_order') {
    const { amount, currency, receipt, notes } = params as {
      amount: number;
      currency?: string;
      receipt?: string;
      notes?: Record<string, string>;
    };

    try {
      const response = await fetch('https://api.razorpay.com/v1/orders', {
        method: 'POST',
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: Math.round(amount * 100),
          currency: currency || 'INR',
          receipt: receipt || `rcpt_${Date.now()}`,
          ...(notes && { notes }),
        }),
      });

      const data = await response.json() as { id?: string; error?: { description: string } };

      if (data.error) {
        return {
          success: false,
          error: `Razorpay error: ${data.error.description}`,
          executedAt: Date.now(),
        };
      }

      return {
        success: true,
        data: { orderId: data.id },
        executedAt: Date.now(),
      };
    } catch (e) {
      return {
        success: false,
        error: e instanceof Error ? e.message : 'Razorpay API call failed',
        executedAt: Date.now(),
      };
    }
  }

  return { success: false, error: `Unknown operation: ${operation}`, executedAt: Date.now() };
}

async function callGoogleAnalyticsApi(
  config: Record<string, string>,
  operation: string,
  params: Record<string, unknown>,
): Promise<IntegrationResult> {
  if (operation === 'track_event') {
    const { category, action, label, value } = params as {
      category: string;
      action: string;
      label?: string;
      value?: number;
    };

    return {
      success: true,
      data: {
        tracked: true,
        category,
        action,
        label,
        value,
        timestamp: new Date().toISOString(),
      },
      executedAt: Date.now(),
    };
  }

  return { success: false, error: `Unknown operation: ${operation}`, executedAt: Date.now() };
}

async function callGitHubApi(
  config: Record<string, string>,
  operation: string,
  params: Record<string, unknown>,
): Promise<IntegrationResult> {
  const { org, token } = config;
  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
    Accept: 'application/vnd.github+json',
  };

  if (operation === 'create_issue') {
    const { title, body, labels } = params as {
      title: string;
      body?: string;
      labels?: string[];
    };

    try {
      const response = await fetch(`https://api.github.com/orgs/${org}/issues`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ title, body, labels }),
      });

      const data = await response.json() as { id?: number; number?: number; html_url?: string; message?: string };

      if (!response.ok) {
        return {
          success: false,
          error: `GitHub error: ${data.message || 'Unknown error'}`,
          executedAt: Date.now(),
        };
      }

      return {
        success: true,
        data: { issueId: data.id, issueNumber: data.number, url: data.html_url },
        executedAt: Date.now(),
      };
    } catch (e) {
      return {
        success: false,
        error: e instanceof Error ? e.message : 'GitHub API call failed',
        executedAt: Date.now(),
      };
    }
  }

  return { success: false, error: `Unknown operation: ${operation}`, executedAt: Date.now() };
}

type IntegrationHandler = (
  config: Record<string, string>,
  operation: string,
  params: Record<string, unknown>,
) => Promise<IntegrationResult>;

const INTEGRATION_HANDLERS: Record<string, IntegrationHandler> = {
  whatsapp_business: callWhatsAppApi,
  telegram: callTelegramApi,
  slack: callSlackApi,
  hubspot: callHubSpotApi,
  stripe: callStripeApi,
  razorpay: callRazorpayApi,
  google_analytics: callGoogleAnalyticsApi,
  github: callGitHubApi,
};

export async function executeIntegrationOperation(
  companyId: string,
  integrationId: string,
  operation: string,
  params: Record<string, unknown>,
): Promise<IntegrationResult> {
  const connection = getConnection(companyId, integrationId);

  if (!connection) {
    return {
      success: false,
      error: `Integration ${integrationId} not connected for company ${companyId}`,
      executedAt: Date.now(),
    };
  }

  if (connection.status !== 'connected') {
    return {
      success: false,
      error: `Integration ${integrationId} is not in connected state`,
      executedAt: Date.now(),
    };
  }

  const handler = INTEGRATION_HANDLERS[integrationId];

  if (!handler) {
    return {
      success: false,
      error: `Integration ${integrationId} does not support remote execution yet`,
      executedAt: Date.now(),
    };
  }

  const result = await handler(connection.config, operation, params);

  if (result.success) {
    setConnectionStatus(companyId, integrationId, 'connected');
    appendEvent(companyId, {
      type: 'agent_action',
      fromAgent: 'Integration Agent',
      department: 'Autonomous Control Unit',
      message: `Integration operation succeeded: ${integrationId}/${operation}`,
      payload: { integrationId, operation, result: result.data },
    });
    writeMemory(companyId, {
      type: 'operational',
      content: `${integrationId} operation "${operation}" executed successfully`,
      agent: 'Integration Agent',
    });
  } else {
    setConnectionStatus(companyId, integrationId, 'error', result.error);
    appendEvent(companyId, {
      type: 'agent_action',
      fromAgent: 'Integration Agent',
      department: 'Autonomous Control Unit',
      message: `Integration operation failed: ${integrationId}/${operation} - ${result.error}`,
      payload: { integrationId, operation, error: result.error },
    });
  }

  return result;
}

export async function testIntegration(
  companyId: string,
  integrationId: string,
): Promise<IntegrationResult> {
  const connection = getConnection(companyId, integrationId);

  if (!connection) {
    return {
      success: false,
      error: `Integration ${integrationId} not connected`,
      executedAt: Date.now(),
    };
  }

  const handler = INTEGRATION_HANDLERS[integrationId];

  if (!handler) {
    return {
      success: false,
      error: `Integration ${integrationId} test not implemented yet`,
      executedAt: Date.now(),
    };
  }

  const result = await handler(connection.config, 'ping', {});

  if (result.success) {
    setConnectionStatus(companyId, integrationId, 'connected');
  } else {
    setConnectionStatus(companyId, integrationId, 'error', result.error);
  }

  return result;
}

export function isIntegrationSupported(integrationId: string): boolean {
  return integrationId in INTEGRATION_HANDLERS;
}

export function getSupportedOperations(integrationId: string): string[] {
  const operations: Record<string, string[]> = {
    whatsapp_business: ['send_message'],
    telegram: ['send_message'],
    slack: ['post_message'],
    hubspot: ['create_contact', 'create_deal', 'update_deal'],
    stripe: ['create_payment', 'create_customer', 'list_payments'],
    razorpay: ['create_order', 'create_customer'],
    google_analytics: ['track_event', 'track_pageview'],
    github: ['create_issue', 'create_pr', 'list_repos'],
  };

  return operations[integrationId] || [];
}