import React, { useCallback } from "react";
import { Button, Card } from "antd";
import { CloseOutlined, MessageOutlined } from "@ant-design/icons";
import ChatMessageComponent from "./ChatMessage";
import ChatForm from "./ChatForm";
import { useChatbot } from "../../contexts/ChatbotContext";
import type { Message } from "../../contexts/ChatbotContext";
import { sendChatMessage } from "../../services/chatServices";
import "./Chatbot.css";

const Chatbot: React.FC = () => {
  const {
    isOpen,
    subtaskContext,
    currentHistory,
    setCurrentHistory,
    activeConversationId,
    setActiveConversationId,
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
        const lastUserMsg = [...history]
          .reverse()
          .find((m) => m.role === "user");
        if (!lastUserMsg) return;

        // Gọi BE API - tự động lưu vào DB
        const res = await sendChatMessage({
          message: lastUserMsg.text,
          conversationId: activeConversationId ?? undefined,
        });

        // Lưu conversationId để các tin nhắn tiếp theo thuộc cùng conversation
        if (!activeConversationId) {
          setActiveConversationId(res.conversationId);
        }

        updateHistory(res.reply);
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
    [activeConversationId, setActiveConversationId, setCurrentHistory],
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
