import "server-only";

type AiGatewayResponse = {
  ok?: boolean;
  model?: string;
  content?: string;
  error?: string;
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

async function readGatewayError(response: Response) {
  try {
    const data = (await response.json()) as AiGatewayResponse;
    return data.error || "AI gateway вернул ошибку.";
  } catch {
    return "AI gateway вернул ошибку.";
  }
}

export async function requestAiGatewayJsonObject<T extends object>(input: {
  model?: string;
  systemPrompt: string;
  userPayload: unknown;
}): Promise<T> {
  const response = await fetch(`${getAiGatewayUrl()}/chat`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getAiGatewayToken()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: input.model ?? getAiGatewayModel(),
      messages: [
        {
          role: "system",
          content: `${input.systemPrompt}\n\nВерни только JSON-объект без markdown, пояснений и fenced code blocks.`,
        },
        {
          role: "user",
          content: JSON.stringify(input.userPayload),
        },
      ],
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
