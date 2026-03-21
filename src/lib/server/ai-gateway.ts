import "server-only";

type AiGatewayResponse = {
  ok?: boolean;
  model?: string;
  content?: string;
  error?: string;
};

type HuggingFaceChatCompletionResponse = {
  error?: {
    message?: string;
  };
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
};

type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

function getAiGatewayUrl() {
  const baseUrl = process.env.AI_GATEWAY_URL?.trim();

  if (!baseUrl) {
    throw new Error("AI_GATEWAY_URL не задан.");
  }

  return baseUrl.replace(/\/+$/, "");
}

function getAiGatewayToken() {
  const token = process.env.AI_GATEWAY_TOKEN?.trim();

  if (!token) {
    throw new Error("AI_GATEWAY_TOKEN не задан.");
  }

  return token;
}

export function getAiGatewayModel() {
  return process.env.AI_GATEWAY_MODEL?.trim() || "@cf/openai/gpt-oss-120b";
}

function getHuggingFaceToken() {
  const token = process.env.HF_TOKEN?.trim() || "";

  if (!token || /replace_me|your_token_here/i.test(token)) {
    return "";
  }

  return token;
}

function hasHuggingFaceFallback() {
  return Boolean(getHuggingFaceToken());
}

function getHuggingFaceBaseUrl() {
  return (
    process.env.HF_BASE_URL?.trim() || "https://router.huggingface.co/v1"
  ).replace(/\/+$/, "");
}

function getHuggingFaceModel() {
  return process.env.HF_CHAT_MODEL?.trim() || "Qwen/Qwen2.5-7B-Instruct";
}

function shouldPreferHuggingFace() {
  return process.env.AI_FORCE_HF?.trim().toLowerCase() === "true";
}

function extractJsonObject(rawContent: string) {
  const directContent = rawContent.trim();

  if (!directContent) {
    throw new Error("AI gateway вернул пустой ответ.");
  }

  try {
    return JSON.parse(directContent) as object;
  } catch {
    const fencedMatch = directContent.match(/```(?:json)?\s*([\s\S]+?)\s*```/i);
    const fencedContent = fencedMatch?.[1]?.trim();

    if (fencedContent) {
      return JSON.parse(fencedContent) as object;
    }

    const firstBrace = directContent.indexOf("{");
    const lastBrace = directContent.lastIndexOf("}");

    if (firstBrace >= 0 && lastBrace > firstBrace) {
      return JSON.parse(
        directContent.slice(firstBrace, lastBrace + 1),
      ) as object;
    }

    throw new Error("AI gateway вернул невалидный JSON.");
  }
}

function buildMessages(input: { systemPrompt: string; userPayload: unknown }) {
  return [
    {
      role: "system",
      content: `${input.systemPrompt}\n\nВерни только JSON-объект без markdown, пояснений и fenced code blocks.`,
    },
    {
      role: "user",
      content: JSON.stringify(input.userPayload),
    },
  ] satisfies ChatMessage[];
}

async function readGatewayError(response: Response) {
  try {
    const data = (await response.json()) as AiGatewayResponse;
    return data.error || "AI gateway вернул ошибку.";
  } catch {
    return "AI gateway вернул ошибку.";
  }
}

async function readHuggingFaceError(response: Response) {
  try {
    const data = (await response.json()) as HuggingFaceChatCompletionResponse;
    return (
      data.error?.message || `Hugging Face вернул ошибку (${response.status}).`
    );
  } catch {
    return `Hugging Face вернул ошибку (${response.status}).`;
  }
}

function isCloudflareQuotaError(message: string) {
  return /4006|daily free allocation|10,000 neurons|workers ai/i.test(message);
}

function shouldFallbackToHuggingFace(message: string) {
  return (
    isCloudflareQuotaError(message) ||
    /AI_GATEWAY_URL не задан|AI_GATEWAY_TOKEN не задан|fetch failed|network|ecconnreset|econnrefused|enotfound|timed out/i.test(
      message,
    )
  );
}

async function requestCloudflareJsonObject<T extends object>(input: {
  model?: string;
  messages: ChatMessage[];
}): Promise<T> {
  const response = await fetch(`${getAiGatewayUrl()}/chat`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getAiGatewayToken()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: input.model ?? getAiGatewayModel(),
      messages: input.messages,
    }),
  });

  if (!response.ok) {
    throw new Error(await readGatewayError(response));
  }

  const responseJson = (await response.json()) as AiGatewayResponse;

  if (!responseJson.ok) {
    throw new Error(responseJson.error || "AI gateway вернул ошибку.");
  }

  const content = responseJson.content?.trim();

  if (!content) {
    throw new Error("AI gateway не вернул content.");
  }

  return extractJsonObject(content) as T;
}

async function requestHuggingFaceJsonObject<T extends object>(input: {
  model?: string;
  messages: ChatMessage[];
}): Promise<T> {
  const token = getHuggingFaceToken();

  if (!token) {
    throw new Error("HF_TOKEN не задан.");
  }

  const candidateModels = Array.from(
    new Set(
      [
        input.model?.trim(),
        getHuggingFaceModel(),
        "Qwen/Qwen2.5-7B-Instruct",
        "katanemo/Arch-Router-1.5B:hf-inference",
      ].filter(Boolean),
    ),
  );
  let lastError = "Hugging Face не вернул content.";

  for (const model of candidateModels) {
    const response = await fetch(
      `${getHuggingFaceBaseUrl()}/chat/completions`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages: input.messages,
          temperature: 0.2,
          max_tokens: 1024,
          response_format: {
            type: "json_object",
          },
        }),
      },
    );

    if (!response.ok) {
      lastError = await readHuggingFaceError(response);

      if (/model_not_supported|not supported by/i.test(lastError)) {
        continue;
      }

      throw new Error(lastError);
    }

    const responseJson =
      (await response.json()) as HuggingFaceChatCompletionResponse;
    const content = responseJson.choices?.[0]?.message?.content?.trim();

    if (content) {
      return extractJsonObject(content) as T;
    }

    lastError = "Hugging Face не вернул content.";
  }

  throw new Error(lastError);
}

export async function requestAiGatewayJsonObject<T extends object>(input: {
  model?: string;
  systemPrompt: string;
  userPayload: unknown;
}): Promise<T> {
  const messages = buildMessages(input);

  if (shouldPreferHuggingFace()) {
    if (!hasHuggingFaceFallback()) {
      throw new Error("AI_FORCE_HF=true, но HF_TOKEN не задан.");
    }

    return requestHuggingFaceJsonObject<T>({
      model: process.env.HF_CHAT_MODEL?.trim() || input.model,
      messages,
    });
  }

  try {
    return await requestCloudflareJsonObject<T>({
      model: input.model ?? getAiGatewayModel(),
      messages,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "AI gateway вернул ошибку.";

    if (!hasHuggingFaceFallback() || !shouldFallbackToHuggingFace(message)) {
      throw error;
    }

    return requestHuggingFaceJsonObject<T>({
      model: process.env.HF_CHAT_MODEL?.trim(),
      messages,
    });
  }
}
