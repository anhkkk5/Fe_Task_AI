import React, { useState } from "react";
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

const ChatForm: React.FC<ChatFormProps> = ({
  chatHistory,
  setChatHistory,
  generateBotResponse,
  isLoading,
}) => {
  const [inputValue, setInputValue] = useState("");

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const userMessage = inputValue.trim();
    if (!userMessage || isLoading) return;

    setInputValue("");

    // Add user message to chat
    setChatHistory((history) => [
      ...history,
      { role: "user", text: userMessage },
    ]);

    // Show thinking indicator
    setTimeout(() => {
      setChatHistory((history) => [
        ...history,
        { role: "model", text: "Đang suy nghĩ..." },
      ]);
    }, 100);

    // Generate response
    generateBotResponse([...chatHistory, { role: "user", text: userMessage }]);
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
};

export default ChatForm;
