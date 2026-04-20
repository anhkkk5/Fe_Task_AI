import React, { useState, forwardRef, useImperativeHandle } from "react";
import { SendOutlined } from "@ant-design/icons";
import { Button, Input } from "antd";

interface ChatMessage {
  role: "user" | "model";
  text: string;
}

interface ChatFormProps {
  chatHistory: ChatMessage[];
  setChatHistory: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  generateBotResponse: (history: ChatMessage[]) => void;
  isLoading: boolean;
}

export interface ChatFormHandle {
  setInputValue: (value: string) => void;
}

const ChatForm = forwardRef<ChatFormHandle, ChatFormProps>(
  ({ chatHistory, setChatHistory, generateBotResponse, isLoading }, ref) => {
    const [inputValue, setInputValue] = useState("");

    // Expose setInputValue to parent
    useImperativeHandle(ref, () => ({
      setInputValue: (value: string) => setInputValue(value),
    }));

    const handleFormSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      const userMessage = inputValue.trim();
      if (!userMessage || isLoading) return;

      setInputValue("");

      setChatHistory((history) => [
        ...history,
        { role: "user", text: userMessage },
      ]);

      setTimeout(() => {
        setChatHistory((history) => [
          ...history,
          { role: "model", text: "Đang suy nghĩ..." },
        ]);
      }, 100);

      generateBotResponse([
        ...chatHistory,
        { role: "user", text: userMessage },
      ]);
    };

    return (
      <form onSubmit={handleFormSubmit} className="chat-form">
        <Input
          type="text"
          className="message-input"
          placeholder="Nhập tin nhắn..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          disabled={isLoading}
          onPressEnter={handleFormSubmit}
        />
        <Button
          type="primary"
          htmlType="submit"
          icon={<SendOutlined />}
          loading={isLoading}
          className="send-button"
        />
      </form>
    );
  },
);

ChatForm.displayName = "ChatForm";

export default ChatForm;
