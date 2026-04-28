import {
  get,
  post,
  getAccessToken,
  del,
  patch,
} from "../../utils/axios/request";

export interface AiConversation {
  id: string;
  title: string;
  updatedAt: string;
  createdAt: string;
}

export interface AiMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  tokens?: number;
}

export const getConversations = async (): Promise<{
  conversations: AiConversation[];
}> => {
  return await get("/ai/conversations");
};

export const getConversationMessages = async (
  id: string,
): Promise<{
  conversation: AiConversation;
  messages: AiMessage[];
}> => {
  return await get(`/ai/conversations/${id}`);
};

export const sendChatMessage = async (params: {
  message: string;
  conversationId?: string;
  parentTaskId?: string;
  systemPrompt?: string;
  subtaskContext?: {
    subtaskTitle?: string;
    parentTaskTitle?: string;
    parentTaskDescription?: string;
    estimatedDuration?: number;
    parentEstimatedDuration?: number;
    dailyTargetMin?: number;
    dailyTargetDuration?: number;
    difficulty?: string;
    description?: string;
    subtaskKey?: string;
    subtaskIndex?: number;
  };
  fewShotMessages?: { role: "user" | "assistant"; content: string }[];
}): Promise<{
  reply: string;
  conversationId: string;
}> => {
  return await post("/ai/chat", params, { timeout: 60000 });
};

export const getOrCreateConversationByParent = async (
  parentTaskId: string,
  title?: string,
): Promise<{
  conversation: AiConversation;
  messages: AiMessage[];
  created: boolean;
}> => {
  const query = title ? `?title=${encodeURIComponent(title)}` : "";
  return await get(
    `/ai/conversations/by-parent/${encodeURIComponent(parentTaskId)}${query}`,
  );
};

export const deleteConversation = async (id: string): Promise<void> => {
  await del(`/ai/conversations/${id}`);
};

export const renameConversation = async (
  id: string,
  title: string,
): Promise<void> => {
  await patch(`/ai/conversations/${id}`, { title });
};

export interface StreamCallbacks {
  onMeta?: (conversationId: string) => void;
  onChunk: (delta: string) => void;
  onDone?: () => void;
  onError?: (msg: string) => void;
}

export const streamChatMessage = async (
  params: { message: string; conversationId?: string },
  callbacks: StreamCallbacks,
): Promise<void> => {
  const baseUrl = (
    import.meta.env?.VITE_API_BASE_URL || "http://localhost:3002"
  ).replace(/\/$/, "");
  const token = getAccessToken();

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout

  let response: Response;
  try {
    response = await fetch(`${baseUrl}/ai/chat/stream`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      credentials: "include",
      body: JSON.stringify(params),
      signal: controller.signal,
    });
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err?.name === "AbortError") {
      callbacks.onError?.("Hết thời gian chờ (60s). Thử lại sau.");
    } else {
      callbacks.onError?.(`Lỗi kết nối: ${err?.message || "unknown"}`);
    }
    return;
  }
  clearTimeout(timeoutId);

  if (!response.ok || !response.body) {
    const errText = await response.text().catch(() => "");
    callbacks.onError?.(`Kết nối thất bại (${response.status}): ${errText}`);
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let doneCalled = false;

  // Process one SSE block (separated by \n\n)
  const processBlock = (block: string) => {
    const lines = block.split("\n");
    let eventType = "";
    let dataStr = "";

    for (const line of lines) {
      if (line.startsWith("event:")) {
        eventType = line.slice(6).trim();
      } else if (line.startsWith("data:")) {
        dataStr = line.slice(5).trim();
      }
    }

    if (!dataStr) return;

    try {
      const parsed = JSON.parse(dataStr);

      if (eventType === "meta") {
        callbacks.onMeta?.(parsed.conversationId);
      } else if (eventType === "chunk") {
        if (parsed.delta) callbacks.onChunk(parsed.delta);
      } else if (eventType === "done") {
        if (!doneCalled) {
          doneCalled = true;
          callbacks.onDone?.();
        }
      } else if (eventType === "error") {
        callbacks.onError?.(parsed.message || "Lỗi không xác định");
      }
    } catch {
      // ignore JSON parse errors
    }
  };

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    // SSE blocks are separated by \n\n
    const blocks = buffer.split("\n\n");
    buffer = blocks.pop() ?? ""; // keep incomplete last block

    for (const block of blocks) {
      const trimmed = block.trim();
      if (trimmed) processBlock(trimmed);
    }
  }

  // Process any remaining data
  if (buffer.trim()) processBlock(buffer.trim());

  if (!doneCalled) {
    callbacks.onDone?.();
  }
};
