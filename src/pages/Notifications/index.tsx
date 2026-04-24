import { useEffect, useState, useCallback, type ReactNode } from "react";
import {
  Card,
  Typography,
  Button,
  Badge,
  Empty,
  Spin,
  InputNumber,
  Switch,
  TimePicker,
  Tabs,
  Dropdown,
  Tag,
  Tooltip,
  message,
  Select,
} from "antd";
import type { MenuProps } from "antd";
import { Link, useNavigate } from "react-router-dom";
import {
  BellOutlined,
  ArrowLeftOutlined,
  CheckOutlined,
  DeleteOutlined,
  MoreOutlined,
  ClockCircleOutlined,
  FireFilled,
  ThunderboltFilled,
  InfoCircleFilled,
  RobotFilled,
  CalendarOutlined,
  RetweetOutlined,
  DownOutlined,
  UpOutlined,
  MoonOutlined,
  GroupOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { useSelector, useDispatch } from "react-redux";
import {
  getNotificationSettings,
  updateNotificationSettings,
  type NotificationQuietHours,
} from "../../services/userServices";
import {
  listSnoozedNotifications,
  listGroupChildren,
  type Notification,
  type NotificationPriority,
  type SnoozeDuration,
  type NotificationAction,
} from "../../services/notificationServices";
import {
  fetchNotifications,
  markAsRead,
  markAllAsRead,
  removeNotification,
  snoozeNotificationThunk,
  unsnoozeNotificationThunk,
} from "../../store/slices/notificationSlice";
import "./Notifications.scss";

const { Title, Text } = Typography;

// ─── Priority meta ─────────────────────────────────────────
const PRIORITY_META: Record<
  NotificationPriority,
  { label: string; color: string; icon: ReactNode }
> = {
  critical: {
    label: "Khẩn cấp",
    color: "#ef4444",
    icon: <FireFilled style={{ color: "#ef4444" }} />,
  },
  high: {
    label: "Cao",
    color: "#f59e0b",
    icon: <ThunderboltFilled style={{ color: "#f59e0b" }} />,
  },
  normal: {
    label: "Bình thường",
    color: "#1aa0b0",
    icon: <InfoCircleFilled style={{ color: "#1aa0b0" }} />,
  },
  low: {
    label: "Thấp",
    color: "#94a3b8",
    icon: <RobotFilled style={{ color: "#94a3b8" }} />,
  },
};

function formatRelativeTime(iso: string): string {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  if (diff < 60_000) return "vừa xong";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} phút trước`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)} giờ trước`;
  if (diff < 7 * 86_400_000)
    return `${Math.floor(diff / 86_400_000)} ngày trước`;
  return d.toLocaleDateString("vi-VN");
}

function Notifications() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items, unreadCount, loading } = useSelector(
    (state: any) => state.notifications,
  );

  // Settings state
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [reminderMinutes, setReminderMinutes] = useState<number>(5);
  const [quietHours, setQuietHours] = useState<NotificationQuietHours>({
    enabled: false,
    start: "22:00",
    end: "07:00",
  });
  const [groupingEnabled, setGroupingEnabled] = useState<boolean>(true);
  const [digestEnabled, setDigestEnabled] = useState<boolean>(false);
  const [digestFrequency, setDigestFrequency] = useState<"daily" | "weekly">(
    "daily",
  );
  const [digestTime, setDigestTime] = useState<string>("08:00");
  const [savingSettings, setSavingSettings] = useState(false);

  // Tabs
  const [activeTab, setActiveTab] = useState<"all" | "snoozed">("all");

  // Snoozed list (lazy-loaded)
  const [snoozedItems, setSnoozedItems] = useState<Notification[]>([]);
  const [snoozedLoading, setSnoozedLoading] = useState(false);

  // Group expand state
  const [expandedGroups, setExpandedGroups] = useState<
    Record<string, { loading: boolean; items: Notification[] }>
  >({});

  const handleRichAction = (item: Notification, action: NotificationAction) => {
    const taskId = action.payload?.taskId || item.data?.taskId;
    const teamId = action.payload?.teamId || item.data?.teamId;

    switch (action.action) {
      case "open_task":
      case "start_task":
      case "reschedule":
      case "smart_reschedule": {
        const query = taskId ? `?focusTask=${taskId}` : "";
        navigate(`/tasks${query}`);
        break;
      }
      case "open_team_task": {
        if (teamId && taskId) {
          navigate(`/teams/${teamId}?taskId=${taskId}`);
        } else if (teamId) {
          navigate(`/teams/${teamId}`);
        } else {
          navigate("/teams");
        }
        break;
      }
      case "snooze_15":
        handleSnooze((item._id || item.id) as string, "15min");
        break;
      default:
        message.info("Hành động này sẽ sớm được hỗ trợ đầy đủ.");
        break;
    }
  };

  // ─── Load main list ──────────────────────────────────────
  useEffect(() => {
    dispatch(fetchNotifications() as any);
  }, [dispatch]);

  // ─── Load settings ───────────────────────────────────────
  useEffect(() => {
    const loadSettings = async () => {
      setSettingsLoading(true);
      try {
        const res: any = await getNotificationSettings();
        const s = res?.settings || {};
        if (typeof s.reminderMinutes === "number") {
          setReminderMinutes(s.reminderMinutes);
        }
        if (s.quietHours) {
          setQuietHours({
            enabled: Boolean(s.quietHours.enabled),
            start: s.quietHours.start || "22:00",
            end: s.quietHours.end || "07:00",
          });
        }
        if (typeof s.groupingEnabled === "boolean") {
          setGroupingEnabled(s.groupingEnabled);
        }
        if (s.digest) {
          setDigestEnabled(Boolean(s.digest.enabled));
          setDigestFrequency(
            s.digest.frequency === "weekly" ? "weekly" : "daily",
          );
          setDigestTime(s.digest.time || "08:00");
        }
      } catch (_err) {
        // keep defaults
      } finally {
        setSettingsLoading(false);
      }
    };
    loadSettings();
  }, []);

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      await updateNotificationSettings({
        reminderMinutes,
        quietHours,
        groupingEnabled,
        digest: {
          enabled: digestEnabled,
          frequency: digestFrequency,
          time: digestTime,
        },
      });
      message.success("Đã lưu cài đặt thông báo");
    } catch (err: any) {
      message.error(err?.response?.data?.message || "Không thể lưu cài đặt");
    } finally {
      setSavingSettings(false);
    }
  };

  // ─── Snoozed tab ─────────────────────────────────────────
  const loadSnoozed = useCallback(async () => {
    setSnoozedLoading(true);
    try {
      const res: any = await listSnoozedNotifications();
      setSnoozedItems(res?.items || []);
    } catch {
      message.error("Không thể tải danh sách đã tạm ẩn");
    } finally {
      setSnoozedLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "snoozed") {
      loadSnoozed();
    }
  }, [activeTab, loadSnoozed]);

  // ─── Handlers ────────────────────────────────────────────
  const handleMarkAsRead = (id: string) => {
    dispatch(markAsRead(id) as any);
  };
  const handleMarkAllAsRead = () => {
    dispatch(markAllAsRead() as any);
  };
  const handleDelete = (id: string) => {
    dispatch(removeNotification(id) as any);
  };
  const handleSnooze = (id: string, duration: SnoozeDuration) => {
    dispatch(snoozeNotificationThunk({ id, duration }) as any)
      .unwrap()
      .then(() => message.success("Đã tạm ẩn thông báo"))
      .catch(() => message.error("Không thể tạm ẩn"));
  };

  const handleUnsnooze = async (n: Notification) => {
    try {
      await dispatch(
        unsnoozeNotificationThunk({
          id: (n._id || n.id) as string,
          notification: n,
        }) as any,
      ).unwrap();
      setSnoozedItems((prev) =>
        prev.filter((x) => (x._id || x.id) !== (n._id || n.id)),
      );
      message.success("Đã đưa thông báo trở lại");
    } catch {
      message.error("Không thể bỏ tạm ẩn");
    }
  };

  const toggleGroupExpand = async (groupId: string) => {
    if (expandedGroups[groupId]) {
      // Collapse
      const { [groupId]: _, ...rest } = expandedGroups;
      setExpandedGroups(rest);
      return;
    }
    setExpandedGroups((prev) => ({
      ...prev,
      [groupId]: { loading: true, items: [] },
    }));
    try {
      const res: any = await listGroupChildren(groupId);
      setExpandedGroups((prev) => ({
        ...prev,
        [groupId]: { loading: false, items: res?.items || [] },
      }));
    } catch {
      setExpandedGroups((prev) => {
        const { [groupId]: _, ...rest } = prev;
        return rest;
      });
      message.error("Không thể tải nhóm thông báo");
    }
  };

  // ─── Render notification item ────────────────────────────
  const renderItem = (item: Notification, isSnoozedTab = false) => {
    const id = (item._id || item.id) as string;
    const priority: NotificationPriority = item.priority || "normal";
    const meta = PRIORITY_META[priority];
    const isGroup = Boolean(item.isGroup);
    const isExpanded = Boolean(expandedGroups[id]);

    const snoozeMenu: MenuProps = {
      items: [
        {
          key: "15min",
          icon: <ClockCircleOutlined />,
          label: "Hoãn 15 phút",
          onClick: () => handleSnooze(id, "15min"),
        },
        {
          key: "1hour",
          icon: <ClockCircleOutlined />,
          label: "Hoãn 1 giờ",
          onClick: () => handleSnooze(id, "1hour"),
        },
        {
          key: "3hour",
          icon: <ClockCircleOutlined />,
          label: "Hoãn 3 giờ",
          onClick: () => handleSnooze(id, "3hour"),
        },
        {
          key: "tomorrow",
          icon: <CalendarOutlined />,
          label: "Đến ngày mai 9:00",
          onClick: () => handleSnooze(id, "tomorrow"),
        },
      ],
    };

    return (
      <div
        key={id}
        className={`noti-item priority-${priority} ${!item.isRead ? "unread" : ""} ${isGroup ? "is-group" : ""}`}
      >
        <div className="noti-priority-indicator" aria-hidden />

        <div className="noti-body">
          <div className="noti-head">
            <span className="noti-prio-icon">{meta.icon}</span>
            <span className="noti-title">
              {item.title}
              {isGroup && (
                <Tag color="blue" className="group-tag">
                  <GroupOutlined /> {item.groupCount || 0}
                </Tag>
              )}
            </span>
            {!item.isRead && <span className="unread-dot" aria-hidden />}
          </div>

          {!isSnoozedTab &&
            Array.isArray(item.data?.actions) &&
            item.data.actions.length > 0 && (
              <div className="rich-actions">
                {item.data.actions.slice(0, 3).map((action) => (
                  <Button
                    key={action.key}
                    size="small"
                    type={action.style === "primary" ? "primary" : "default"}
                    danger={action.style === "danger"}
                    onClick={() => handleRichAction(item, action)}
                  >
                    {action.label}
                  </Button>
                ))}
              </div>
            )}

          <div className="noti-message">{item.content || item.message}</div>

          <div className="noti-meta">
            <Tag color={meta.color} bordered={false} className="prio-tag">
              {meta.label}
            </Tag>
            <span className="noti-time">
              {formatRelativeTime(item.createdAt)}
            </span>
            {isSnoozedTab && item.snoozedUntil && (
              <span className="snooze-until">
                <MoonOutlined /> Hẹn lại đến{" "}
                {new Date(item.snoozedUntil).toLocaleString("vi-VN", {
                  hour: "2-digit",
                  minute: "2-digit",
                  day: "2-digit",
                  month: "2-digit",
                })}
              </span>
            )}
          </div>

          {/* Group children expand */}
          {isGroup && isExpanded && (
            <div className="group-children">
              {expandedGroups[id].loading ? (
                <div className="group-loading">
                  <Spin size="small" /> Đang tải...
                </div>
              ) : expandedGroups[id].items.length === 0 ? (
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Nhóm trống
                </Text>
              ) : (
                expandedGroups[id].items.map((child) => (
                  <div key={child._id || child.id} className="child-item">
                    <span className="child-title">{child.title}</span>
                    <span className="child-time">
                      {formatRelativeTime(child.createdAt)}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        <div className="noti-actions">
          {isGroup && (
            <Tooltip title={isExpanded ? "Thu gọn" : "Xem chi tiết nhóm"}>
              <Button
                type="text"
                size="small"
                icon={isExpanded ? <UpOutlined /> : <DownOutlined />}
                onClick={() => toggleGroupExpand(id)}
              />
            </Tooltip>
          )}

          {isSnoozedTab ? (
            <Tooltip title="Đưa về danh sách chính">
              <Button
                type="text"
                size="small"
                icon={<RetweetOutlined />}
                onClick={() => handleUnsnooze(item)}
              />
            </Tooltip>
          ) : (
            <>
              {!item.isRead && (
                <Tooltip title="Đánh dấu đã đọc">
                  <Button
                    type="text"
                    size="small"
                    icon={<CheckOutlined />}
                    onClick={() => handleMarkAsRead(id)}
                  />
                </Tooltip>
              )}
              <Dropdown
                menu={snoozeMenu}
                trigger={["click"]}
                placement="bottomRight"
              >
                <Tooltip title="Tạm ẩn (Snooze)">
                  <Button
                    type="text"
                    size="small"
                    icon={<ClockCircleOutlined />}
                  />
                </Tooltip>
              </Dropdown>
              <Tooltip title="Xóa">
                <Button
                  type="text"
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => handleDelete(id)}
                />
              </Tooltip>
            </>
          )}
          <Dropdown
            menu={{
              items: isSnoozedTab
                ? [
                    {
                      key: "unsnooze",
                      icon: <RetweetOutlined />,
                      label: "Bỏ tạm ẩn",
                      onClick: () => handleUnsnooze(item),
                    },
                  ]
                : ([
                    !item.isRead && {
                      key: "read",
                      icon: <CheckOutlined />,
                      label: "Đánh dấu đã đọc",
                      onClick: () => handleMarkAsRead(id),
                    },
                    { type: "divider" as const },
                    {
                      key: "delete",
                      icon: <DeleteOutlined />,
                      label: "Xóa",
                      danger: true,
                      onClick: () => handleDelete(id),
                    },
                  ].filter(Boolean) as any),
            }}
            trigger={["click"]}
            placement="bottomRight"
          >
            <Button type="text" size="small" icon={<MoreOutlined />} />
          </Dropdown>
        </div>
      </div>
    );
  };

  const mainList = items as Notification[];

  return (
    <div className="notifications-page">
      <main className="notifications-main">
        <div className="page-header">
          <Link to="/" className="back-link">
            <ArrowLeftOutlined /> Quay lại Dashboard
          </Link>
          <Title level={2}>
            Thông báo <Badge count={unreadCount} />
          </Title>
          <Text type="secondary">Quản lý thông báo và nhắc nhở của bạn</Text>
        </div>

        {/* ─── Settings card ─────────────────────────── */}
        <Card className="settings-card" bordered={false}>
          <Spin spinning={settingsLoading}>
            <div className="settings-grid">
              <div className="setting-row">
                <div className="setting-label">
                  <Text strong>Nhắc trước deadline (phút)</Text>
                  <Text type="secondary" className="setting-hint">
                    Áp dụng cho email nhắc task sắp bắt đầu
                  </Text>
                </div>
                <InputNumber
                  min={0}
                  max={24 * 60}
                  value={reminderMinutes}
                  onChange={(v) =>
                    setReminderMinutes(typeof v === "number" ? v : 5)
                  }
                />
              </div>

              <div className="setting-row">
                <div className="setting-label">
                  <Text strong>
                    <MoonOutlined /> Khung giờ không làm phiền
                  </Text>
                  <Text type="secondary" className="setting-hint">
                    Không gửi email trong khung giờ này (chỉ khẩn cấp mới vượt
                    qua)
                  </Text>
                </div>
                <div className="quiet-controls">
                  <Switch
                    checked={quietHours.enabled}
                    onChange={(v) =>
                      setQuietHours((q) => ({ ...q, enabled: v }))
                    }
                  />
                  <TimePicker
                    format="HH:mm"
                    value={dayjs(quietHours.start, "HH:mm")}
                    onChange={(v) =>
                      setQuietHours((q) => ({
                        ...q,
                        start: v ? v.format("HH:mm") : "22:00",
                      }))
                    }
                    disabled={!quietHours.enabled}
                    allowClear={false}
                  />
                  <span>→</span>
                  <TimePicker
                    format="HH:mm"
                    value={dayjs(quietHours.end, "HH:mm")}
                    onChange={(v) =>
                      setQuietHours((q) => ({
                        ...q,
                        end: v ? v.format("HH:mm") : "07:00",
                      }))
                    }
                    disabled={!quietHours.enabled}
                    allowClear={false}
                  />
                </div>
              </div>

              <div className="setting-row">
                <div className="setting-label">
                  <Text strong>
                    <GroupOutlined /> Gom nhóm thông báo
                  </Text>
                  <Text type="secondary" className="setting-hint">
                    Gom các thông báo cùng loại trong 1 giờ thành một nhóm
                  </Text>
                </div>
                <Switch
                  checked={groupingEnabled}
                  onChange={setGroupingEnabled}
                />
              </div>

              <div className="setting-row">
                <div className="setting-label">
                  <Text strong>Digest Email</Text>
                  <Text type="secondary" className="setting-hint">
                    Gửi email tóm tắt thông báo theo lịch thay vì gửi rời rạc
                  </Text>
                </div>
                <div className="digest-controls">
                  <Switch checked={digestEnabled} onChange={setDigestEnabled} />
                  <Select
                    value={digestFrequency}
                    onChange={(v) => setDigestFrequency(v)}
                    style={{ width: 120 }}
                    disabled={!digestEnabled}
                    options={[
                      { value: "daily", label: "Hàng ngày" },
                      { value: "weekly", label: "Hàng tuần" },
                    ]}
                  />
                  <TimePicker
                    format="HH:mm"
                    value={dayjs(digestTime, "HH:mm")}
                    onChange={(v) =>
                      setDigestTime(v ? v.format("HH:mm") : "08:00")
                    }
                    disabled={!digestEnabled}
                    allowClear={false}
                  />
                </div>
              </div>

              <div className="setting-actions">
                <Button
                  type="primary"
                  loading={savingSettings}
                  onClick={handleSaveSettings}
                >
                  Lưu cài đặt
                </Button>
              </div>
            </div>
          </Spin>
        </Card>

        {/* ─── List tabs ─────────────────────────────── */}
        <Card className="notifications-list-card" bordered={false}>
          <Tabs
            activeKey={activeTab}
            onChange={(k) => setActiveTab(k as any)}
            tabBarExtraContent={
              activeTab === "all" && mainList.length > 0 ? (
                <Button
                  type="text"
                  icon={<CheckOutlined />}
                  onClick={handleMarkAllAsRead}
                >
                  Đánh dấu tất cả đã đọc
                </Button>
              ) : null
            }
            items={[
              {
                key: "all",
                label: (
                  <span>
                    <BellOutlined /> Tất cả
                    {unreadCount > 0 && (
                      <Badge count={unreadCount} offset={[8, -2]} />
                    )}
                  </span>
                ),
                children: (
                  <Spin spinning={loading}>
                    {mainList.length === 0 ? (
                      <Empty
                        description="Không có thông báo nào"
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                      />
                    ) : (
                      <div className="noti-list">
                        {mainList.map((item) => renderItem(item, false))}
                      </div>
                    )}
                  </Spin>
                ),
              },
              {
                key: "snoozed",
                label: (
                  <span>
                    <MoonOutlined /> Đã tạm ẩn
                    {snoozedItems.length > 0 && (
                      <Badge
                        count={snoozedItems.length}
                        offset={[8, -2]}
                        color="#94a3b8"
                      />
                    )}
                  </span>
                ),
                children: (
                  <Spin spinning={snoozedLoading}>
                    {snoozedItems.length === 0 ? (
                      <Empty
                        description="Không có thông báo đang tạm ẩn"
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                      />
                    ) : (
                      <div className="noti-list">
                        {snoozedItems.map((item) => renderItem(item, true))}
                      </div>
                    )}
                  </Spin>
                ),
              },
            ]}
          />
        </Card>
      </main>
    </div>
  );
}

export default Notifications;
