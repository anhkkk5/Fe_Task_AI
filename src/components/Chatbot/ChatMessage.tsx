import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { UserOutlined, RobotOutlined } from "@ant-design/icons";

interface ChatMessage {
  role: "user" | "model";
  text: string;
}

interface ChatMessageProps {
  chat: ChatMessage;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ chat }) => {
  const isBot = chat.role === "model";

  return (
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
      <div className="message-content">
        <div className="message-text">
          {chat.text === "Đang suy nghĩ..." ? (
            <div className="typing-indicator">
              <span></span>
              <span></span>
              <span></span>
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
                pre: ({ ...props }) => <pre className="chat-pre" {...props} />,
              }}
            >
              {chat.text || ""}
            </ReactMarkdown>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
