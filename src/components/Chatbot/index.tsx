import React, { useCallback, useRef, useState, useEffect } from "react";
import { Button, Card } from "antd";
import {
  CloseOutlined,
  MessageOutlined,
  DragOutlined,
} from "@ant-design/icons";
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

  // Drag state for chatbot button position
  const [btnPos, setBtnPos] = useState({ x: 0, y: 0 });
  const [popupPos, setPopupPos] = useState({ x: 0, y: 0 });
  const isDragging = useRef(false);
  const dragStart = useRef({ mouseX: 0, mouseY: 0, elemX: 0, elemY: 0 });
  const hasDragged = useRef(false);

  // Drag for toggle button
  const handleBtnMouseDown = (e: React.MouseEvent) => {
    if (isOpen) return;
    isDragging.current = true;
    hasDragged.current = false;
    dragStart.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      elemX: btnPos.x,
      elemY: btnPos.y,
    };
    e.preventDefault();
  };

  // Drag for popup header
  const handlePopupMouseDown = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest("button")) return;
    isDragging.current = true;
    hasDragged.current = false;
    dragStart.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      elemX: popupPos.x,
      elemY: popupPos.y,
    };
    e.preventDefault();
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      const dx = e.clientX - dragStart.current.mouseX;
      const dy = e.clientY - dragStart.current.mouseY;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) hasDragged.current = true;
      const newX = dragStart.current.elemX + dx;
      const newY = dragStart.current.elemY + dy;
      if (isOpen) {
        setPopupPos({ x: newX, y: newY });
      } else {
        setBtnPos({ x: newX, y: newY });
      }
    };

    const handleMouseUp = () => {
      isDragging.current = false;
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isOpen]);

  const handleBtnClick = () => {
    if (!hasDragged.current) openGeneral();
  };

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
          parentTaskId: subtaskContext?.parentTaskId,
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
                subtaskKey: subtaskContext.subtaskKey,
                subtaskIndex: subtaskContext.subtaskIndex,
              }
            : undefined,
        });

        if (!activeConversationId) {
          setActiveConversationId(res.conversationId);
        }

        updateHistory(res.reply);

        if ((res as any).tasksCreated > 0) {
          window.dispatchEvent(
            new CustomEvent("ai-tasks-created", {
              detail: { count: (res as any).tasksCreated },
            }),
          );
        }
      } catch (error) {
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
    <div
      className="chatbot-container"
      style={{
        transform: isOpen
          ? `translate(${popupPos.x}px, ${popupPos.y}px)`
          : `translate(${btnPos.x}px, ${btnPos.y}px)`,
      }}
    >
      {!isOpen && (
        <Button
          type="primary"
          shape="circle"
          size="large"
          className="chatbot-toggle-btn"
          icon={<MessageOutlined />}
          onMouseDown={handleBtnMouseDown}
          onClick={handleBtnClick}
        />
      )}

      {isOpen && (
        <Card
          className="chatbot-popup"
          title={
            <div
              className="chatbot-drag-handle"
              onMouseDown={handlePopupMouseDown}
              style={{
                cursor: "grab",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <DragOutlined style={{ opacity: 0.5, fontSize: 12 }} />
              {cardTitle}
            </div>
          }
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
