import { createOpenAICompatible } from '@ai-sdk/openai-compatible';

export function createLovableAiGatewayProvider(
  lovableApiKey: string,
  options?: { structuredOutputs?: boolean },
) {
  return createOpenAICompatible({
    name: 'lovable',
    baseURL: 'https://ai.gateway.lovable.dev/v1',
    supportsStructuredOutputs: options?.structuredOutputs ?? false,
    headers: {
      'Lovable-API-Key': lovableApiKey,
      'X-Lovable-AIG-SDK': 'vercel-ai-sdk',
    },
  });
}

// Direct OpenAI provider — used when OPENAI_API_KEY is set (e.g. Netlify deploys
// where the Lovable gateway key is not available).
export function createOpenAiProvider(
  apiKey: string,
  options?: { structuredOutputs?: boolean },
) {
  return createOpenAICompatible({
    name: 'openai',
    baseURL: 'https://api.openai.com/v1',
    supportsStructuredOutputs: options?.structuredOutputs ?? true,
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  });
}

/**
 * Resolve the vision model to use for foot analysis.
 * Prefers a direct OpenAI key so the app works on any host (Netlify, Vercel, etc.),
 * and falls back to the Lovable AI Gateway when running inside Lovable.
 */
export function resolveVisionModel() {
  const openaiKey = process.env.OPENAI_API_KEY;
  if (openaiKey) {
    return createOpenAiProvider(openaiKey, { structuredOutputs: true })('gpt-4o');
  }

  const lovableKey = process.env.LOVABLE_API_KEY;
  if (lovableKey) {
    return createLovableAiGatewayProvider(lovableKey, { structuredOutputs: true })(
      'openai/gpt-5.6-sol',
    );
  }

  return null;
}
