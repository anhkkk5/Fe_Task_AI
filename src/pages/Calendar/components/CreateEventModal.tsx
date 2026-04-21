import React, { useState, useEffect } from "react";
import {
  Modal,
  Tabs,
  Input,
  Row,
  Col,
  Space,
  Button,
  Select,
  TimePicker,
  Checkbox,
  message,
} from "antd";
import {
  ClockCircleOutlined,
  UserOutlined,
  VideoCameraOutlined,
  EnvironmentOutlined,
  FileTextOutlined,
  GlobalOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import GuestManager from "../../../components/GuestManager/GuestManager";
import { createGoogleMeetLink } from "../../../services/backendGoogleServices";
import type { GoogleUserInfo } from "../../../services/backendGoogleServices";

interface CreateEventModalProps {
  open: boolean;
  onCancel: () => void;
  onSave: (payload: any) => Promise<boolean>;
  initialStart: dayjs.Dayjs | null;
  initialEnd: dayjs.Dayjs | null;
  googleUser: GoogleUserInfo | null;
  isGoogleLoading: boolean;
  onGoogleSignIn: () => void;
  onGoogleSignOut: () => void;
}

export const CreateEventModal: React.FC<CreateEventModalProps> = ({
  open,
  onCancel,
  onSave,
  initialStart,
  initialEnd,
  googleUser,
  isGoogleLoading,
  onGoogleSignIn,
  onGoogleSignOut,
}) => {
  const [creatingTask, setCreatingTask] = useState(false);
  const [createTitle, setCreateTitle] = useState("");
  const [createType, setCreateType] = useState<
    "event" | "todo" | "appointment"
  >("event");
  const [createAllDay, setCreateAllDay] = useState(false);
  const [createGuests, setCreateGuests] = useState<string[]>([]);
  const [createLocation, setCreateLocation] = useState("");
  const [createReminder, setCreateReminder] = useState<number | null>(15);
  const [createVisibility, setCreateVisibility] = useState<
    "default" | "public" | "private"
  >("default");
  const [createDescription, setCreateDescription] = useState("");
  const [createMeetingLink, setCreateMeetingLink] = useState("");
  const [createStart, setCreateStart] = useState<dayjs.Dayjs | null>(null);
  const [createEnd, setCreateEnd] = useState<dayjs.Dayjs | null>(null);

  const [showGuestManager, setShowGuestManager] = useState(false);
  const [guestManagerEventId, setGuestManagerEventId] = useState<string>("");

  useEffect(() => {
    if (open) {
      setCreateStart(initialStart);
      setCreateEnd(initialEnd);
      setCreateTitle("");
      setCreateType("event");
      setCreateAllDay(false);
      setCreateGuests([]);
      setCreateLocation("");
      setCreateReminder(15);
      setCreateVisibility("default");
      setCreateDescription("");
      setCreateMeetingLink("");
    }
  }, [open, initialStart, initialEnd]);

  // Handle Google Meet link creation
  const [localGoogleLoading, setLocalGoogleLoading] = useState(false);

  const handleCreateRealMeetLink = async () => {
    if (!createStart || !createEnd || !createTitle) {
      message.error("Vui lòng nhập tiêu đề và chọn thời gian");
      return;
    }

    setLocalGoogleLoading(true);
    try {
      const meetData = await createGoogleMeetLink({
        title: createTitle,
        description: createDescription,
        startTime: createStart.toISOString(),
        endTime: createEnd.toISOString(),
        guests: createGuests,
      });

      if (meetData) {
        setCreateMeetingLink(meetData.meetingUri);
        message.success("Đã tạo link Google Meet thật");
      } else {
        message.error("Không thể tạo link Google Meet");
      }
    } catch (error: any) {
      if (error.message?.includes("Chưa đăng nhập Google")) {
        message.info("Vui lòng đăng nhập Google để tạo link Meet");
        onGoogleSignIn();
      } else {
        message.error(error?.message || "Lỗi tạo link Meet");
      }
    } finally {
      setLocalGoogleLoading(false);
    }
  };

  const handleSave = async () => {
    if (!createStart || !createEnd) {
      message.error("Vui lòng chọn thời gian bắt đầu và kết thúc");
      return;
    }
    const title = createTitle.trim();
    if (!title) {
      message.error("Vui lòng nhập tiêu đề công việc");
      return;
    }
    if (!createEnd.isAfter(createStart)) {
      message.error("Giờ kết thúc phải sau giờ bắt đầu");
      return;
    }

    setCreatingTask(true);
    try {
      let guestDetails = undefined;
      // In old code this used createEventId which wasn't fully hooked up. Just passing guest details via manager.
      // Skipping getEventGuests for the temporary temp_${Date.now()} logic unless needed, but we keep the parameter signature.

      const ok = await onSave({
        title,
        status: "scheduled",
        priority: "medium",
        type: createType,
        allDay: createAllDay,
        guests: createGuests.length > 0 ? createGuests : undefined,
        guestDetails,
        location: createLocation.trim() || undefined,
        visibility: createVisibility,
        reminderMinutes: createReminder ?? undefined,
        description: createDescription.trim() || undefined,
        meetingLink: createMeetingLink.trim() || undefined,
        scheduledTime: {
          start: createStart.toISOString(),
          end: createEnd.toISOString(),
          aiPlanned: false,
          reason: "Người dùng tạo từ lịch",
        },
      });

      if (ok) {
        onCancel();
      }
    } finally {
      setCreatingTask(false);
    }
  };

  return (
    <>
      <Modal
        open={open}
        onCancel={onCancel}
        title={
          <Tabs
            activeKey={createType}
            onChange={(k) => setCreateType(k as any)}
            centered
            items={[
              { key: "event", label: "Sự kiện" },
              { key: "todo", label: "Việc cần làm" },
              { key: "appointment", label: "Lên lịch hẹn" },
            ]}
          />
        }
        footer={
          <Space>
            <Button onClick={onCancel}>Đóng</Button>
            <Button type="primary" loading={creatingTask} onClick={handleSave}>
              Lưu
            </Button>
          </Space>
        }
        width={600}
      >
        <div style={{ padding: "0 8px" }}>
          {/* Title */}
          <div style={{ marginBottom: 20 }}>
            <Input
              value={createTitle}
              onChange={(e) => setCreateTitle(e.target.value)}
              placeholder="Thêm tiêu đề"
              variant="borderless"
              style={{
                fontSize: 22,
                fontWeight: 400,
                padding: 0,
                borderBottom: "1px solid #dadce0",
                borderRadius: 0,
              }}
              autoFocus
            />
          </div>

          {/* Date/Time Row */}
          <Row gutter={16} align="middle" style={{ marginBottom: 20 }}>
            <Col flex="32px" style={{ textAlign: "center" }}>
              <ClockCircleOutlined style={{ fontSize: 18, color: "#5f6368" }} />
            </Col>
            <Col flex="auto">
              <Row gutter={8} align="middle">
                <Col>
                  <Checkbox
                    checked={createAllDay}
                    onChange={(e) => setCreateAllDay(e.target.checked)}
                  >
                    Cả ngày
                  </Checkbox>
                </Col>
                <Col>
                  <TimePicker
                    value={createStart}
                    onChange={(v: dayjs.Dayjs | null) => {
                      if (!createStart || !v) return;
                      const next = createStart
                        .clone()
                        .hour(v.hour())
                        .minute(v.minute());
                      setCreateStart(next);
                      if (createEnd && createEnd.isBefore(next)) {
                        setCreateEnd(next.add(30, "minute"));
                      }
                    }}
                    format="HH:mm"
                    minuteStep={5}
                    allowClear={false}
                    disabled={createAllDay}
                    style={{ width: 100 }}
                  />
                </Col>
                <Col style={{ color: "#5f6368" }}>-</Col>
                <Col>
                  <TimePicker
                    value={createEnd}
                    onChange={(v: dayjs.Dayjs | null) => {
                      if (!createEnd || !v) return;
                      setCreateEnd(
                        createEnd.clone().hour(v.hour()).minute(v.minute()),
                      );
                    }}
                    format="HH:mm"
                    minuteStep={5}
                    allowClear={false}
                    disabled={createAllDay}
                    style={{ width: 100 }}
                  />
                </Col>
                <Col>
                  <Select
                    value={createReminder}
                    onChange={setCreateReminder}
                    style={{ width: 140 }}
                    variant="borderless"
                    options={[
                      { value: null, label: "Không nhắc" },
                      { value: 0, label: "Vào thời điểm" },
                      { value: 15, label: "15 phút trước" },
                      { value: 30, label: "30 phút trước" },
                      { value: 60, label: "1 giờ trước" },
                      { value: 1440, label: "1 ngày trước" },
                    ]}
                  />
                </Col>
              </Row>
            </Col>
          </Row>

          {/* Google Sign In Button */}
          {!googleUser && (
            <Row gutter={16} style={{ marginBottom: 12 }}>
              <Col flex="32px" />
              <Col flex="auto">
                <Button
                  loading={isGoogleLoading}
                  onClick={onGoogleSignIn}
                  style={{
                    border: "1px solid #dadce0",
                    borderRadius: 4,
                    color: "#3c4043",
                  }}
                >
                  <span style={{ marginRight: 8 }}>🔒</span>
                  Đăng nhập Google để lấy avatar khách và tạo Meet
                </Button>
              </Col>
            </Row>
          )}

          {/* Signed In User */}
          {googleUser && (
            <Row gutter={16} style={{ marginBottom: 12 }}>
              <Col flex="32px" />
              <Col flex="auto">
                <Space>
                  {googleUser.picture ? (
                    <img
                      src={googleUser.picture}
                      alt={googleUser.name}
                      style={{ width: 24, height: 24, borderRadius: "50%" }}
                    />
                  ) : (
                    <UserOutlined />
                  )}
                  <span>{googleUser.name}</span>
                  <Button type="link" size="small" onClick={onGoogleSignOut}>
                    Đăng xuất
                  </Button>
                </Space>
              </Col>
            </Row>
          )}

          {/* Guests */}
          <Row gutter={16} style={{ marginBottom: 20 }}>
            <Col flex="32px" style={{ textAlign: "center", paddingTop: 4 }}>
              <UserOutlined style={{ fontSize: 18, color: "#5f6368" }} />
            </Col>
            <Col flex="auto">
              <Button
                type="default"
                block
                onClick={() => {
                  setGuestManagerEventId(`temp_${Date.now()}`);
                  setShowGuestManager(true);
                }}
                style={{
                  background: "#e8eaed",
                  border: "none",
                  color: "#3c4043",
                  fontWeight: 500,
                }}
              >
                <span style={{ marginRight: 8 }}>👥</span>
                {createGuests.length > 0
                  ? `${createGuests.length} khách`
                  : "Quản lý khách"}
              </Button>
            </Col>
          </Row>

          {/* Meet */}
          {!createMeetingLink ? (
            <Row gutter={16} style={{ marginBottom: 20 }}>
              <Col flex="32px" style={{ textAlign: "center" }}>
                <VideoCameraOutlined
                  style={{ fontSize: 18, color: "#5f6368" }}
                />
              </Col>
              <Col flex="auto">
                <Button
                  type="default"
                  loading={localGoogleLoading}
                  style={{
                    background: "#e8eaed",
                    border: "none",
                    color: "#3c4043",
                    fontWeight: 500,
                  }}
                  onClick={handleCreateRealMeetLink}
                >
                  <span style={{ marginRight: 8 }}>📹</span>
                  Thêm hội nghị truyền hình trên Google Meet
                </Button>
              </Col>
            </Row>
          ) : (
            <Row gutter={16} style={{ marginBottom: 20 }}>
              <Col flex="32px" style={{ textAlign: "center", paddingTop: 4 }}>
                <VideoCameraOutlined
                  style={{ fontSize: 18, color: "#1a73e8" }}
                />
              </Col>
              <Col flex="auto">
                <div
                  style={{
                    background: "#e8f0fe",
                    borderRadius: 4,
                    padding: "8px 12px",
                    display: "flex",
                    justifyContent: "space-between",
                  }}
                >
                  <span style={{ color: "#1a73e8", fontWeight: 500 }}>
                    📹 Tham gia bằng Google Meet
                  </span>
                  <Button
                    type="link"
                    size="small"
                    onClick={() => setCreateMeetingLink("")}
                    style={{ color: "#5f6368" }}
                  >
                    Xóa
                  </Button>
                </div>
                <div style={{ marginTop: 4, paddingLeft: 4 }}>
                  <a
                    href={createMeetingLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: "#1a73e8", fontSize: 13 }}
                  >
                    {createMeetingLink}
                  </a>
                </div>
              </Col>
            </Row>
          )}

          {/* Location */}
          <Row gutter={16} style={{ marginBottom: 20 }}>
            <Col flex="32px" style={{ textAlign: "center", paddingTop: 4 }}>
              <EnvironmentOutlined style={{ fontSize: 18, color: "#5f6368" }} />
            </Col>
            <Col flex="auto">
              <Input
                placeholder="Thêm vị trí"
                value={createLocation}
                onChange={(e) => setCreateLocation(e.target.value)}
                variant="borderless"
                style={{ width: "100%" }}
              />
            </Col>
          </Row>

          {/* Description */}
          <Row gutter={16} style={{ marginBottom: 20 }}>
            <Col flex="32px" style={{ textAlign: "center", paddingTop: 4 }}>
              <FileTextOutlined style={{ fontSize: 18, color: "#5f6368" }} />
            </Col>
            <Col flex="auto">
              <Input.TextArea
                placeholder="Thêm mô tả hoặc tệp đính kèm"
                value={createDescription}
                onChange={(e) => setCreateDescription(e.target.value)}
                variant="borderless"
                autoSize={{ minRows: 2, maxRows: 6 }}
                style={{ width: "100%", resize: "none" }}
              />
            </Col>
          </Row>

          {/* Visibility */}
          <Row gutter={16} style={{ marginBottom: 12 }}>
            <Col flex="32px" style={{ textAlign: "center", paddingTop: 4 }}>
              <GlobalOutlined style={{ fontSize: 18, color: "#5f6368" }} />
            </Col>
            <Col flex="auto">
              <Space size={4} style={{ color: "#5f6368", fontSize: 13 }}>
                <span style={{ color: "#1a73e8", fontWeight: 500 }}>Bạn</span>
                <span>•</span>
                <Select
                  value={createVisibility}
                  onChange={setCreateVisibility}
                  variant="borderless"
                  options={[
                    { value: "default", label: "Chế độ hiển thị mặc định" },
                    { value: "public", label: "Công khai" },
                    { value: "private", label: "Riêng tư" },
                  ]}
                />
              </Space>
            </Col>
          </Row>
        </div>
      </Modal>

      <Modal
        open={showGuestManager}
        onCancel={() => setShowGuestManager(false)}
        title="Quản lý khách"
        width={700}
        footer={[
          <Button key="close" onClick={() => setShowGuestManager(false)}>
            Đóng
          </Button>,
        ]}
      >
        {guestManagerEventId && (
          <GuestManager
            eventId={guestManagerEventId}
            onGuestAdded={(guest) => {
              if (!createGuests.includes(guest.email)) {
                setCreateGuests([...createGuests, guest.email]);
              }
            }}
            onGuestRemoved={(_guestId) => {}}
          />
        )}
      </Modal>
    </>
  );
};
