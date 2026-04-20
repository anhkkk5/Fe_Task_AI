import React, { useCallback, useRef } from "react";
import { Button, Card } from "antd";
import { CloseOutlined, MessageOutlined } from "@ant-design/icons";
import ChatMessageComponent from "./ChatMessage";
import ChatForm from "./ChatForm";
import type { ChatFormHandle } from "./ChatForm";
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

  const chatFormRef = useRef<ChatFormHandle | null>(null);

  // Handle text selection from bot messages → pre-fill input
  const handleAskAboutSelection = useCallback((selectedText: string) => {
    const contextMessage = `"${selectedText}" — `;
    chatFormRef.current?.setInputValue(contextMessage);
    const input = document.querySelector(".message-input") as HTMLInputElement;
    if (input) {
      input.focus();
      setTimeout(() => {
        input.setSelectionRange(contextMessage.length, contextMessage.length);
      }, 0);
    }
  }, []);

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

        const res = await sendChatMessage({
          message: lastUserMsg.text,
          conversationId: activeConversationId ?? undefined,
          subtaskContext: subtaskContext
            ? {
                subtaskTitle: subtaskContext.subtaskTitle,
                parentTaskTitle: subtaskContext.parentTaskTitle,
                parentTaskDescription: subtaskContext.parentTaskDescription,
                estimatedDuration: subtaskContext.estimatedDuration,
                parentEstimatedDuration: subtaskContext.parentEstimatedDuration,
                dailyTargetMin: subtaskContext.dailyTargetMin,
                dailyTargetDuration: subtaskContext.dailyTargetDuration,
                difficulty: subtaskContext.difficulty,
                description: subtaskContext.description,
              }
            : undefined,
        });

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
    [
      subtaskContext,
      activeConversationId,
      setActiveConversationId,
      setCurrentHistory,
    ],
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
              <ChatMessageComponent
                key={index}
                chat={chat}
                onAskAboutSelection={handleAskAboutSelection}
              />
            ))}
          </div>
          <ChatForm
            ref={chatFormRef}
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
