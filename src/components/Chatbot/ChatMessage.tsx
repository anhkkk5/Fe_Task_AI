import React, { useState, useRef, useEffect, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import {
  UserOutlined,
  RobotOutlined,
  QuestionCircleOutlined,
} from "@ant-design/icons";

interface ChatMessage {
  role: "user" | "model";
  text: string;
}

interface ChatMessageProps {
  chat: ChatMessage;
  onAskAboutSelection?: (selectedText: string) => void;
}

const ChatMessage: React.FC<ChatMessageProps> = ({
  chat,
  onAskAboutSelection,
}) => {
  const isBot = chat.role === "model";
  const messageRef = useRef<HTMLDivElement>(null);
  const [popup, setPopup] = useState<{
    show: boolean;
    x: number;
    y: number;
    text: string;
  }>({
    show: false,
    x: 0,
    y: 0,
    text: "",
  });

  const handleMouseUp = useCallback(() => {
    if (!isBot || !onAskAboutSelection) return;

    // Small delay to let selection finalize
    setTimeout(() => {
      const selection = window.getSelection();
      const selectedText = selection?.toString().trim() ?? "";

      if (!selectedText || selectedText.length < 3) {
        setPopup((p) => ({ ...p, show: false }));
        return;
      }

      // Check if selection is inside this message
      if (!messageRef.current) return;
      const range = selection?.getRangeAt(0);
      if (!range) return;
      if (!messageRef.current.contains(range.commonAncestorContainer)) return;

      const rect = range.getBoundingClientRect();
      setPopup({
        show: true,
        x: rect.left + rect.width / 2,
        y: rect.top - 8,
        text: selectedText,
      });
    }, 10);
  }, [isBot, onAskAboutSelection]);

  useEffect(() => {
    document.addEventListener("mouseup", handleMouseUp);
    return () => document.removeEventListener("mouseup", handleMouseUp);
  }, [handleMouseUp]);

  // Hide popup on click outside
  useEffect(() => {
    const hide = () => setPopup((p) => ({ ...p, show: false }));
    document.addEventListener("mousedown", hide);
    return () => document.removeEventListener("mousedown", hide);
  }, []);

  const handleAskClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (popup.text && onAskAboutSelection) {
      onAskAboutSelection(popup.text);
      setPopup({ show: false, x: 0, y: 0, text: "" });
      window.getSelection()?.removeAllRanges();
    }
  };

  return (
    <>
      <div className={`message ${isBot ? "bot-message" : "user-message"}`}>
        <div className="message-avatar">
          {isBot ? (
            <div className="bot-avatar">
              <RobotOutlined />
            </div>
          ) : (
            <div className="user-avatar">
              <UserOutlined />
            </div>
          )}
        </div>
        <div className="message-content" ref={messageRef}>
          <div className="message-text">
            {chat.text === "Đang suy nghĩ..." ? (
              <div className="typing-indicator">
                <span />
                <span />
                <span />
              </div>
            ) : (
              <ReactMarkdown
                rehypePlugins={[rehypeRaw]}
                remarkPlugins={[remarkGfm]}
                components={{
                  ul: ({ ...props }) => <ul className="chat-list" {...props} />,
                  ol: ({ ...props }) => <ol className="chat-list" {...props} />,
                  strong: ({ ...props }) => (
                    <strong className="chat-bold" {...props} />
                  ),
                  code: ({ ...props }) => (
                    <code className="chat-code" {...props} />
                  ),
                  pre: ({ ...props }) => (
                    <pre className="chat-pre" {...props} />
                  ),
                  blockquote: ({ ...props }) => (
                    <blockquote className="chat-blockquote" {...props} />
                  ),
                  h2: ({ ...props }) => <h2 className="chat-h2" {...props} />,
                  h3: ({ ...props }) => <h3 className="chat-h3" {...props} />,
                  hr: ({ ...props }) => <hr className="chat-hr" {...props} />,
                }}
              >
                {chat.text || ""}
              </ReactMarkdown>
            )}
          </div>
        </div>
      </div>

      {/* Floating selection popup */}
      {popup.show && (
        <div
          className="selection-popup"
          style={{
            position: "fixed",
            left: popup.x,
            top: popup.y,
            zIndex: 9999,
          }}
          onMouseDown={handleAskClick}
        >
          <button className="ask-selection-btn">
            <QuestionCircleOutlined />
            <span>Hỏi về đoạn này</span>
          </button>
        </div>
      )}
    </>
  );
};

export default ChatMessage;
