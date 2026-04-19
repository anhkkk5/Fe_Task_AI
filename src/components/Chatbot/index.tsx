import React, { useCallback } from "react";
import { Button, Card } from "antd";
import { CloseOutlined, MessageOutlined } from "@ant-design/icons";
import ChatMessageComponent from "./ChatMessage";
import ChatForm from "./ChatForm";
import { useChatbot } from "../../contexts/ChatbotContext";
import type {
  SubtaskChatContext,
  Message,
} from "../../contexts/ChatbotContext";
import "./Chatbot.css";

const buildSystemPrompt = (ctx: SubtaskChatContext | null): string => {
  if (!ctx) {
    return (
      "Bạn là AI Assistant cho hệ thống quản lý công việc Task Management. " +
      "Bạn giúp người dùng quản lý task, lập kế hoạch, phân tích thói quen làm việc. " +
      "Trả lời bằng tiếng Việt, ngắn gọn, rõ ràng. " +
      "Nếu không biết câu trả lời, hãy nói rõ và gợi ý người dùng liên hệ admin."
    );
  }

  return (
    `Bạn là AI tutor chuyên về "${ctx.subtaskTitle}" trong context của task "${ctx.parentTaskTitle}".\n\n` +
    `Nhiệm vụ của bạn:\n` +
    `1. Giải thích lý thuyết về "${ctx.subtaskTitle}" một cách rõ ràng, dễ hiểu\n` +
    `2. Cung cấp các bài tập thực hành có hướng dẫn từng bước\n` +
    `3. Đưa ra ví dụ minh họa cụ thể và thực tế\n` +
    `4. Trả lời câu hỏi follow-up và duy trì context cuộc trò chuyện\n\n` +
    (ctx.difficulty ? `Độ khó: ${ctx.difficulty}\n` : "") +
    (ctx.description ? `Mô tả: ${ctx.description}\n` : "") +
    `\nTrả lời bằng tiếng Việt, chi tiết và có cấu trúc rõ ràng.`
  );
};

const Chatbot: React.FC = () => {
  const {
    isOpen,
    subtaskContext,
    currentHistory,
    setCurrentHistory,
    openGeneral,
    close,
  } = useChatbot();

  const generateBotResponse = useCallback(
    async (history: Message[]) => {
      const updateHistory = (text: string, isError = false) => {
        setCurrentHistory((prev) => {
          const newHistory = prev.filter(
            (msg) => msg.text !== "Đang suy nghĩ...",
          );
          return [
            ...newHistory,
            { role: "model" as const, text: isError ? `❌ ${text}` : text },
          ];
        });
      };

      try {
        const apiKey = import.meta.env.VITE_GROQ_API_KEY;
        if (!apiKey) {
          updateHistory("Vui lòng cấu hình GROQ_API_KEY trong file .env", true);
          return;
        }

        const messages = history.map((chat) => ({
          role: chat.role === "user" ? "user" : "assistant",
          content: chat.text,
        }));

        const systemPrompt = {
          role: "system",
          content: buildSystemPrompt(subtaskContext),
        };

        const response = await fetch(
          "https://api.groq.com/openai/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
              model: "llama-3.1-8b-instant",
              messages: [systemPrompt, ...messages],
              temperature: 0.7,
              max_tokens: 1024,
              top_p: 0.9,
            }),
          },
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.error?.message ||
              `HTTP error! status: ${response.status}`,
          );
        }

        const data = await response.json();
        const botResponse =
          data.choices?.[0]?.message?.content ||
          "Xin lỗi, tôi không thể trả lời lúc này.";

        updateHistory(botResponse);
      } catch (error) {
        console.error("Chatbot Error:", error);
        updateHistory(
          error instanceof Error
            ? error.message
            : "Đã xảy ra lỗi khi kết nối với AI",
          true,
        );
      }
    },
    [subtaskContext, setCurrentHistory],
  );

  const cardTitle = subtaskContext
    ? `📚 ${subtaskContext.subtaskTitle}`
    : "AI Assistant";

  const cardExtra = subtaskContext ? (
    <span style={{ fontSize: 12, opacity: 0.8 }}>
      {subtaskContext.parentTaskTitle}
    </span>
  ) : (
    <span>Task Management</span>
  );

  return (
    <div className="chatbot-container">
      {/* Floating Button — chỉ hiện khi không có subtask context đang mở */}
      {!isOpen && (
        <Button
          type="primary"
          shape="circle"
          size="large"
          className="chatbot-toggle-btn"
          icon={<MessageOutlined />}
          onClick={openGeneral}
        />
      )}

      {/* Chat Popup */}
      {isOpen && (
        <Card
          className="chatbot-popup"
          title={cardTitle}
          extra={
            <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {cardExtra}
              <Button
                type="text"
                size="small"
                icon={<CloseOutlined />}
                onClick={close}
                style={{ color: "white" }}
              />
            </span>
          }
        >
          <div className="chatbot-messages">
            {currentHistory.map((chat, index) => (
              <ChatMessageComponent key={index} chat={chat} />
            ))}
          </div>
          <ChatForm
            chatHistory={currentHistory}
            setChatHistory={setCurrentHistory}
            generateBotResponse={generateBotResponse}
            isLoading={false}
          />
        </Card>
      )}
    </div>
  );
};

export default Chatbot;
