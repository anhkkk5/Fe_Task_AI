import { useState, useEffect, useRef } from "react";
import {
  Card,
  Input,
  Button,
  List,
  Avatar,
  Typography,
  Spin,
  Empty,
} from "antd";
import {
  SendOutlined,
  RobotOutlined,
  UserOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import { useSelector } from "react-redux";
import { aiChat } from "../../services/aiServices";
import {
  getChats,
  createChat,
  getMessages,
  sendMessage,
} from "../../services/chatServices";
import "./Chat.scss";

const { Text } = Typography;

interface Message {
  _id?: string;
  content: string;
  sender: "user" | "ai";
  createdAt: string;
}

interface Chat {
  _id?: string;
  id?: string;
  title: string;
  lastMessage?: string;
}

function Chat() {
  const { user } = useSelector((state: any) => state.loginReducer);
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadChats();
  }, []);

  useEffect(() => {
    if (activeChat) {
      loadMessages(activeChat);
    }
  }, [activeChat]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadChats = async () => {
    try {
      const response = await getChats();
      setChats(response.chats || []);
    } catch (error) {
      console.error("Failed to load chats:", error);
    }
  };

  const loadMessages = async (chatId: string) => {
    setLoading(true);
    try {
      const response = await getMessages(chatId);
      setMessages(response.messages || []);
    } catch (error) {
      console.error("Failed to load messages:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleNewChat = async () => {
    try {
      const response = await createChat("Cuộc trò chuyện mới");
      const newChat = response.chat;
      setChats([newChat, ...chats]);
      setActiveChat(newChat._id || newChat.id);
      setMessages([]);
    } catch (error) {
      console.error("Failed to create chat:", error);
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !activeChat) return;

    const userMessage: Message = {
      content: inputMessage,
      sender: "user",
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");

    try {
      // Send to backend
      await sendMessage(activeChat, userMessage.content);

      // Get AI response
      const aiResponse = await aiChat(userMessage.content);

      const aiMessage: Message = {
        content:
          aiResponse.message || "Xin lỗi, tôi không thể trả lời ngay bây giờ.",
        sender: "ai",
        createdAt: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="chat-page">
      {/* Chat Sidebar */}
      <div className="chat-sidebar">
        <Button
          type="primary"
          icon={<SendOutlined />}
          onClick={handleNewChat}
          className="new-chat-btn"
        >
          Cuộc trò chuyện mới
        </Button>

        <List
          dataSource={chats}
          renderItem={(chat) => (
            <List.Item
              className={`chat-item ${activeChat === (chat._id || chat.id) ? "active" : ""}`}
              onClick={() => setActiveChat((chat._id || chat.id) as string)}
              actions={[
                <Button
                  key="delete"
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={(e) => {
                    e.stopPropagation();
                    // Handle delete
                  }}
                />,
              ]}
            >
              <div className="chat-info">
                <Text strong>{chat.title}</Text>
                <Text type="secondary" className="chat-preview">
                  {chat.lastMessage || "Chưa có tin nhắn"}
                </Text>
              </div>
            </List.Item>
          )}
        />
      </div>

      {/* Chat Main Content */}
      <div className="chat-main">
        {!activeChat ? (
          <div className="empty-chat">
            <Empty
              description="Chọn cuộc trò chuyện hoặc tạo mới"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          </div>
        ) : (
          <>
            <div className="messages-container">
              <Spin spinning={loading}>
                <List
                  dataSource={messages}
                  renderItem={(message) => (
                    <List.Item className={`message-item ${message.sender}`}>
                      <div className="message-content">
                        <Avatar
                          icon={
                            message.sender === "user" ? (
                              <UserOutlined />
                            ) : (
                              <RobotOutlined />
                            )
                          }
                          className={message.sender}
                        />
                        <div className="message-bubble">
                          <Text>{message.content}</Text>
                          <Text type="secondary" className="message-time">
                            {new Date(message.createdAt).toLocaleTimeString(
                              "vi-VN",
                            )}
                          </Text>
                        </div>
                      </div>
                    </List.Item>
                  )}
                />
                <div ref={messagesEndRef} />
              </Spin>
            </div>

            <div className="input-container">
              <Input.TextArea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Nhập tin nhắn..."
                autoSize={{ minRows: 1, maxRows: 4 }}
              />
              <Button
                type="primary"
                icon={<SendOutlined />}
                onClick={handleSendMessage}
                disabled={!inputMessage.trim()}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Chat;
