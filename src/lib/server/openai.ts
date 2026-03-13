import "server-only";

type OpenAiResponsesApiResult = {
  output_text?: string;
  error?: {
    message?: string;
  };
};

function getOpenAiApiKey() {
  const apiKey = process.env.OPENAI_API_KEY?.trim();

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY не задан.");
  }

  return apiKey;
}

export function getOpenAiModel() {
  return process.env.OPENAI_MODEL?.trim() || "gpt-5-mini";
}

async function readErrorMessage(response: Response) {
  try {
    const data = (await response.json()) as OpenAiResponsesApiResult;
    return data.error?.message || "OpenAI API вернул ошибку.";
  } catch {
    return "OpenAI API вернул ошибку.";
  }
}

export async function requestOpenAiJsonObject<T extends object>(input: {
  model?: string;
  systemPrompt: string;
  userPayload: unknown;
}): Promise<T> {
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getOpenAiApiKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: input.model ?? getOpenAiModel(),
      input: [
        {
          role: "system",
          content: [
            {
              type: "input_text",
              text: input.systemPrompt,
            },
          ],
        },
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: JSON.stringify(input.userPayload),
            },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  const responseJson = (await response.json()) as OpenAiResponsesApiResult;
  const outputText = responseJson.output_text?.trim();

  if (!outputText) {
    throw new Error("OpenAI API не вернул output_text.");
  }

  try {
    return JSON.parse(outputText) as T;
  } catch {
    throw new Error("OpenAI API вернул невалидный JSON.");
  }
}
