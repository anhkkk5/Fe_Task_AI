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
  DatePicker,
  Checkbox,
  message,
} from "antd";
import {
  ClockCircleOutlined,
  UserOutlined,
  VideoCameraOutlined,
  EnvironmentOutlined,
  FileTextOutlined,
  LinkOutlined,
  CalendarOutlined,
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
  isGoogleLoading?: boolean;
  onGoogleSignIn?: () => void;
  onGoogleSignOut?: () => void;
}

export const CreateEventModal: React.FC<CreateEventModalProps> = ({
  open,
  onCancel,
  onSave,
  initialStart,
  initialEnd,
  googleUser,
  onGoogleSignIn,
}) => {
  const [creatingTask, setCreatingTask] = useState(false);
  const [createTitle, setCreateTitle] = useState("");
  const [createType, setCreateType] = useState<"event" | "todo">("event");
  const [createAllDay, setCreateAllDay] = useState(false);
  const [createGuests, setCreateGuests] = useState<string[]>([]);
  const [createLocation, setCreateLocation] = useState("");
  const [createReminder, setCreateReminder] = useState<number | null>(15);
  const [createDescription, setCreateDescription] = useState("");
  const [createMeetingLink, setCreateMeetingLink] = useState("");
  const [createStart, setCreateStart] = useState<dayjs.Dayjs | null>(null);
  const [createEnd, setCreateEnd] = useState<dayjs.Dayjs | null>(null);
  const [todoDeadline, setTodoDeadline] = useState<dayjs.Dayjs | null>(null);

  const [showGuestManager, setShowGuestManager] = useState(false);
  const [guestManagerEventId, setGuestManagerEventId] = useState<string>("");

  const isEvent = createType === "event";

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
      setCreateDescription("");
      setCreateMeetingLink("");
      setTodoDeadline(initialStart || dayjs());
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
        onGoogleSignIn?.();
      } else {
        message.error(error?.message || "Lỗi tạo link Meet");
      }
    } finally {
      setLocalGoogleLoading(false);
    }
  };

  const handleSave = async () => {
    const title = createTitle.trim();
    if (!title) {
      message.error("Vui lòng nhập tiêu đề");
      return;
    }

    if (isEvent) {
      if (!createStart || !createEnd) {
        message.error("Vui lòng chọn thời gian bắt đầu và kết thúc");
        return;
      }
      if (!createEnd.isAfter(createStart)) {
        message.error("Giờ kết thúc phải sau giờ bắt đầu");
        return;
      }
    }

    setCreatingTask(true);
    try {
      const payload: any = {
        title,
        status: isEvent ? "scheduled" : "todo",
        priority: "medium",
        type: createType,
        description: createDescription.trim() || undefined,
      };

      if (isEvent) {
        payload.allDay = createAllDay;
        payload.guests = createGuests.length > 0 ? createGuests : undefined;
        payload.location = createLocation.trim() || undefined;
        payload.reminderMinutes = createReminder ?? undefined;
        payload.meetingLink = createMeetingLink.trim() || undefined;
        payload.scheduledTime = {
          start: createStart!.toISOString(),
          end: createEnd!.toISOString(),
          aiPlanned: false,
          reason: "Người dùng tạo từ lịch",
        };
      } else {
        // Todo: just deadline
        if (todoDeadline) {
          payload.dueDate = todoDeadline.toISOString();
          payload.scheduledTime = {
            start: todoDeadline.startOf("day").toISOString(),
            end: todoDeadline.endOf("day").toISOString(),
            aiPlanned: false,
            reason: "Người dùng tạo việc cần làm",
          };
        }
      }

      const ok = await onSave(payload);
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
        width={560}
      >
        <div style={{ padding: "0 8px" }}>
          {/* Title */}
          <div style={{ marginBottom: 20 }}>
            <Input
              value={createTitle}
              onChange={(e) => setCreateTitle(e.target.value)}
              placeholder={isEvent ? "Thêm tiêu đề sự kiện" : "Việc cần làm"}
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

          {isEvent ? (
            /* ═══════ EVENT FORM ═══════ */
            <>
              {/* Date/Time Row */}
              <Row gutter={16} align="middle" style={{ marginBottom: 20 }}>
                <Col flex="32px" style={{ textAlign: "center" }}>
                  <ClockCircleOutlined
                    style={{ fontSize: 18, color: "#5f6368" }}
                  />
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
                      ? `${createGuests.length} khách mời`
                      : "Thêm khách mời"}
                  </Button>
                </Col>
              </Row>

              {/* Meeting Link */}
              {!createMeetingLink ? (
                <Row gutter={16} style={{ marginBottom: 20 }}>
                  <Col
                    flex="32px"
                    style={{ textAlign: "center", paddingTop: 4 }}
                  >
                    <VideoCameraOutlined
                      style={{ fontSize: 18, color: "#5f6368" }}
                    />
                  </Col>
                  <Col flex="auto">
                    {googleUser ? (
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
                        Tạo Google Meet
                      </Button>
                    ) : (
                      <Input
                        placeholder="Dán link cuộc họp (Zoom, Teams, Meet...)"
                        prefix={<LinkOutlined style={{ color: "#5f6368" }} />}
                        value={createMeetingLink}
                        onChange={(e) => setCreateMeetingLink(e.target.value)}
                        style={{ width: "100%" }}
                      />
                    )}
                  </Col>
                </Row>
              ) : (
                <Row gutter={16} style={{ marginBottom: 20 }}>
                  <Col
                    flex="32px"
                    style={{ textAlign: "center", paddingTop: 4 }}
                  >
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
                        alignItems: "center",
                      }}
                    >
                      <a
                        href={createMeetingLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          color: "#1a73e8",
                          fontWeight: 500,
                          fontSize: 13,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          maxWidth: 380,
                        }}
                      >
                        📹 {createMeetingLink}
                      </a>
                      <Button
                        type="link"
                        size="small"
                        onClick={() => setCreateMeetingLink("")}
                        style={{ color: "#5f6368", flexShrink: 0 }}
                      >
                        Xóa
                      </Button>
                    </div>
                  </Col>
                </Row>
              )}

              {/* Location */}
              <Row gutter={16} style={{ marginBottom: 20 }}>
                <Col flex="32px" style={{ textAlign: "center", paddingTop: 4 }}>
                  <EnvironmentOutlined
                    style={{ fontSize: 18, color: "#5f6368" }}
                  />
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
              <Row gutter={16} style={{ marginBottom: 12 }}>
                <Col flex="32px" style={{ textAlign: "center", paddingTop: 4 }}>
                  <FileTextOutlined
                    style={{ fontSize: 18, color: "#5f6368" }}
                  />
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
            </>
          ) : (
            /* ═══════ TODO FORM ═══════ */
            <>
              {/* Deadline */}
              <Row gutter={16} align="middle" style={{ marginBottom: 20 }}>
                <Col flex="32px" style={{ textAlign: "center" }}>
                  <CalendarOutlined
                    style={{ fontSize: 18, color: "#5f6368" }}
                  />
                </Col>
                <Col flex="auto">
                  <Space>
                    <DatePicker
                      value={todoDeadline}
                      onChange={(v) => setTodoDeadline(v)}
                      format="DD/MM/YYYY"
                      allowClear={false}
                      placeholder="Chọn hạn chót"
                      style={{ width: 160 }}
                    />
                    <TimePicker
                      value={todoDeadline}
                      onChange={(v: dayjs.Dayjs | null) => {
                        if (!todoDeadline || !v) return;
                        setTodoDeadline(
                          todoDeadline
                            .clone()
                            .hour(v.hour())
                            .minute(v.minute()),
                        );
                      }}
                      format="HH:mm"
                      minuteStep={5}
                      placeholder="Giờ"
                      style={{ width: 100 }}
                    />
                  </Space>
                </Col>
              </Row>

              {/* Description */}
              <Row gutter={16} style={{ marginBottom: 12 }}>
                <Col flex="32px" style={{ textAlign: "center", paddingTop: 4 }}>
                  <FileTextOutlined
                    style={{ fontSize: 18, color: "#5f6368" }}
                  />
                </Col>
                <Col flex="auto">
                  <Input.TextArea
                    placeholder="Thêm ghi chú"
                    value={createDescription}
                    onChange={(e) => setCreateDescription(e.target.value)}
                    variant="borderless"
                    autoSize={{ minRows: 2, maxRows: 6 }}
                    style={{ width: "100%", resize: "none" }}
                  />
                </Col>
              </Row>
            </>
          )}
        </div>
      </Modal>

      <Modal
        open={showGuestManager}
        onCancel={() => setShowGuestManager(false)}
        title="Quản lý khách mời"
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
