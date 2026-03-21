export interface Env {
  AI: {
    run: (model: string, payload: AiRunPayload) => Promise<unknown>;
  };
  AI_GATEWAY_TOKEN?: string;
  ALLOWED_ORIGINS?: string;
}

type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

type ChatBody = {
  messages?: ChatMessage[];
  prompt?: string;
  model?: string;
};

type JsonResponseFormat = {
  type: "json_object";
};

type AiRunPayload = {
  messages: ChatMessage[];
  max_tokens: number;
  temperature: number;
  response_format?: JsonResponseFormat;
};

type WorkerAiResult = {
  model?: string;
  response?:
    | string
    | Record<string, unknown>
    | Array<string | { text?: string; content?: string; type?: string }>;
  content?:
    | string
    | Record<string, unknown>
    | Array<{ text?: string; content?: string; type?: string }>;
  result?: {
    response?:
      | string
      | Record<string, unknown>
      | Array<string | { text?: string; content?: string; type?: string }>;
  };
  usage?: {
    input_tokens?: number;
    output_tokens?: number;
    total_tokens?: number;
    prompt_tokens?: number;
    completion_tokens?: number;
  };
  choices?: Array<{
    message?: {
      content?:
        | string
        | Record<string, unknown>
        | Array<{ text?: string; content?: string; type?: string }>;
      reasoning_content?: string;
    };
  }>;
};

const DEFAULT_MODEL = "@cf/qwen/qwen3-30b-a3b-fp8";

function buildCorsHeaders(origin: string | null, env: Env) {
  const allowedOrigins = (env.ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  const allowedOrigin =
    origin && allowedOrigins.includes(origin)
      ? origin
      : allowedOrigins[0] || "";

  return {
    "access-control-allow-origin": allowedOrigin,
    "access-control-allow-methods": "GET, POST, OPTIONS",
    "access-control-allow-headers": "Content-Type, Authorization",
    vary: "Origin",
  };
}

function json(data: unknown, status: number, origin: string | null, env: Env) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...buildCorsHeaders(origin, env),
    },
  });
}

function normalizeMessages(body: ChatBody) {
  if (Array.isArray(body.messages) && body.messages.length > 0) {
    return body.messages;
  }

  if (body.prompt?.trim()) {
    return [
      { role: "user", content: body.prompt.trim() },
    ] satisfies ChatMessage[];
  }

  return [];
}

function getAiContent(result: WorkerAiResult) {
  const pickTextFromArray = (
    value: Array<string | { text?: string; content?: string; type?: string }>,
  ) =>
    value
      .map((part) => {
        if (typeof part === "string") {
          return part.trim();
        }

        return part.text?.trim() || part.content?.trim() || "";
      })
      .filter(Boolean)
      .join("\n")
      .trim();

  const stringifyObject = (value: unknown) => {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      return "";
    }

    try {
      return JSON.stringify(value);
    } catch {
      return "";
    }
  };

  const firstChoice = result.choices?.[0]?.message?.content;

  if (typeof firstChoice === "string" && firstChoice.trim()) {
    return firstChoice.trim();
  }

  const firstChoiceObject = stringifyObject(firstChoice);

  if (firstChoiceObject) {
    return firstChoiceObject;
  }

  const reasoningContent = result.choices?.[0]?.message?.reasoning_content;

  if (typeof reasoningContent === "string" && reasoningContent.trim()) {
    return reasoningContent.trim();
  }

  if (Array.isArray(firstChoice)) {
    const combined = pickTextFromArray(firstChoice);

    if (combined) {
      return combined;
    }
  }

  if (typeof result.content === "string" && result.content.trim()) {
    return result.content.trim();
  }

  const contentObject = stringifyObject(result.content);

  if (contentObject) {
    return contentObject;
  }

  if (Array.isArray(result.content)) {
    const combined = pickTextFromArray(result.content);

    if (combined) {
      return combined;
    }
  }

  if (typeof result.response === "string" && result.response.trim()) {
    return result.response.trim();
  }

  const responseObject = stringifyObject(result.response);

  if (responseObject) {
    return responseObject;
  }

  if (Array.isArray(result.response)) {
    const combined = pickTextFromArray(result.response);

    if (combined) {
      return combined;
    }
  }

  if (
    typeof result.result?.response === "string" &&
    result.result.response.trim()
  ) {
    return result.result.response.trim();
  }

  const nestedResponseObject = stringifyObject(result.result?.response);

  if (nestedResponseObject) {
    return nestedResponseObject;
  }

  if (Array.isArray(result.result?.response)) {
    const combined = pickTextFromArray(result.result.response);

    if (combined) {
      return combined;
    }
  }

  return "";
}

function isAuthorized(request: Request, env: Env) {
  const expectedToken = env.AI_GATEWAY_TOKEN?.trim();

  if (!expectedToken) {
    return false;
  }

  const authorization = request.headers.get("authorization") ?? "";

  return authorization === `Bearer ${expectedToken}`;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const origin = request.headers.get("origin");

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: buildCorsHeaders(origin, env),
      });
    }

    if (request.method === "GET" && url.pathname === "/health") {
      return json(
        {
          ok: true,
          service: "projects-tracker-ai",
          model: DEFAULT_MODEL,
        },
        200,
        origin,
        env,
      );
    }

    if (request.method === "POST" && url.pathname === "/chat") {
      if (!isAuthorized(request, env)) {
        return json({ ok: false, error: "Unauthorized" }, 401, origin, env);
      }

      try {
        const body = (await request.json()) as ChatBody;
        const messages = normalizeMessages(body);

        if (messages.length === 0) {
          return json(
            { ok: false, error: "Provide 'messages' or 'prompt'" },
            400,
            origin,
            env,
          );
        }

        const model = body.model?.trim() || DEFAULT_MODEL;
        const result = (await env.AI.run(model, {
          messages,
          max_tokens: 1024,
          temperature: 0.2,
          response_format: {
            type: "json_object",
          },
        })) as WorkerAiResult;
        const content = getAiContent(result);

        if (!content) {
          return json(
            {
              ok: false,
              error: "Workers AI returned empty content",
              debug: JSON.stringify(result).slice(0, 4000),
            },
            502,
            origin,
            env,
          );
        }

        return json(
          {
            ok: true,
            model: result.model ?? model,
            content,
            usage: result.usage ?? {},
          },
          200,
          origin,
          env,
        );
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unknown worker error";

        return json({ ok: false, error: message }, 500, origin, env);
      }
    }

    return json({ ok: false, error: "Not found" }, 404, origin, env);
  },
};
