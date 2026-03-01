import { useState, useEffect, useMemo } from "react";
import {
  Card,
  Typography,
  Button,
  Badge,
  Tag,
  Tooltip,
  Modal,
  Space,
  Select,
  Empty,
  Spin,
  Alert,
  Divider,
  Statistic,
  Row,
  Col,
  message,
} from "antd";
import { Link, useNavigate } from "react-router-dom";
import {
  CalendarOutlined,
  ArrowLeftOutlined,
  LeftOutlined,
  RightOutlined,
  RobotOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  PlusOutlined,
  SyncOutlined,
  BulbOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import "dayjs/locale/vi";
import { useTasks } from "../../hooks/useTasks";
import {
  aiSchedulePlan,
  type AIScheduleResponse,
} from "../../services/aiServices";
import "./Calendar.scss";

const { Title, Text } = Typography;
const { Option } = Select;

dayjs.locale("vi");

interface CalendarEvent {
  id: string;
  title: string;
  start: dayjs.Dayjs;
  end: dayjs.Dayjs;
  priority: "low" | "medium" | "high" | "urgent";
  status: string;
  aiScheduled?: boolean;
  reason?: string;
}

const HOURS = Array.from({ length: 24 }, (_, i) => {
  const hour = i;
  return [
    { hour, minute: 0, label: `${hour.toString().padStart(2, "0")}:00` },
    { hour, minute: 30, label: `${hour.toString().padStart(2, "0")}:30` },
  ];
}).flat();

const WEEK_DAYS = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

function Calendar() {
  const navigate = useNavigate();
  const { tasks, loading: tasksLoading } = useTasks();
  const [currentWeek, setCurrentWeek] = useState(dayjs());
  const [selectedDate, setSelectedDate] = useState<dayjs.Dayjs | null>(null);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSchedule, setAiSchedule] = useState<AIScheduleResponse | null>(null);
  const [viewMode, setViewMode] = useState<"week" | "day">("week");

  const weekDays = useMemo(() => {
    const startOfWeek = currentWeek.startOf("week");
    return Array.from({ length: 7 }, (_, i) => startOfWeek.add(i, "day"));
  }, [currentWeek]);

  const events = useMemo<CalendarEvent[]>(() => {
    if (!tasks.length) return [];

    return tasks
      .filter((t: any) => t.deadline || t.dueDate)
      .map((t: any) => {
        const deadline = dayjs(t.deadline || t.dueDate);
        const start = deadline.subtract(2, "hour");
        return {
          id: t._id || t.id,
          title: t.title,
          start,
          end: deadline,
          priority: t.priority || "medium",
          status: t.status,
          aiScheduled: !!(t.aiBreakdown && t.aiBreakdown.length > 0),
        };
      });
  }, [tasks]);

  const analyzeSchedule = async () => {
    const pendingTasks = tasks.filter(
      (t: any) => t.status !== "completed" && t.status !== "done",
    );
    if (pendingTasks.length === 0) {
      message.info("Khong co cong viec nao can len lich!");
      return;
    }

    setAiLoading(true);
    try {
      const taskIds = pendingTasks.slice(0, 10).map((t: any) => t._id || t.id);
      const result = await aiSchedulePlan({
        taskIds,
        startDate: currentWeek.format("YYYY-MM-DD"),
      });
      setAiSchedule(result);
      setScheduleModalOpen(true);
      message.success("AI da phan tich va tao lich toi uu!");
    } catch (error: any) {
      message.error(error?.message || "Khong the tao lich. Vui long thu lai!");
    } finally {
      setAiLoading(false);
    }
  };

  const getEventPosition = (event: CalendarEvent) => {
    const startHour = event.start.hour();
    const startMinute = event.start.minute();
    const top = startHour * 60 + startMinute;
    const duration = event.end.diff(event.start, "minute");
    const height = Math.max(duration, 30);
    return { top, height };
  };

  const isEventInDay = (event: CalendarEvent, day: dayjs.Dayjs) => {
    return (
      event.start.isSame(day, "day") ||
      (event.start.isBefore(day, "day") && event.end.isAfter(day, "day"))
    );
  };

  // Calculate overlapping events and their horizontal positions
  const getOverlappingEvents = (events: CalendarEvent[], day: dayjs.Dayjs) => {
    const dayEvents = events.filter((e) => isEventInDay(e, day));

    // Sort by start time
    dayEvents.sort((a, b) => a.start.valueOf() - b.start.valueOf());

    // Group overlapping events
    const groups: CalendarEvent[][] = [];

    dayEvents.forEach((event) => {
      let added = false;

      // Try to add to existing group
      for (const group of groups) {
        const overlaps = group.some(
          (e) => event.start.isBefore(e.end) && event.end.isAfter(e.start),
        );

        if (overlaps) {
          group.push(event);
          added = true;
          break;
        }
      }

      // Create new group if not added
      if (!added) {
        groups.push([event]);
      }
    });

    // Calculate position for each event
    const eventPositions = new Map<string, { width: number; left: number }>();

    groups.forEach((group) => {
      const count = group.length;
      const width = 100 / count;

      group.forEach((event, index) => {
        eventPositions.set(event.id, {
          width: width - 2, // 2% gap
          left: index * width + 1, // 1% margin
        });
      });
    });

    return eventPositions;
  };

  const getPriorityColor = (priority: string) => {
    const map: Record<string, string> = {
      low: "#52c41a",
      medium: "#faad14",
      high: "#f5222d",
      urgent: "#722ed1",
    };
    return map[priority] || "#1890ff";
  };

  const goToPreviousWeek = () =>
    setCurrentWeek(currentWeek.subtract(1, "week"));
  const goToNextWeek = () => setCurrentWeek(currentWeek.add(1, "week"));
  const goToToday = () => setCurrentWeek(dayjs());

  const weekTasks = events.filter(
    (e) =>
      e.start.isAfter(weekDays[0].startOf("day")) &&
      e.start.isBefore(weekDays[6].endOf("day")),
  );
  const totalTasks = weekTasks.length;
  const highPriorityTasks = weekTasks.filter(
    (e) => e.priority === "high" || e.priority === "urgent",
  ).length;
  const aiAssistedTasks = weekTasks.filter((e) => e.aiScheduled).length;

  return (
    <div className="calendar-page">
      <main className="calendar-main">
        <div className="calendar-header">
          <div className="header-left">
            <Link to="/" className="back-link">
              <ArrowLeftOutlined /> Dashboard
            </Link>
            <Title level={3} style={{ margin: 0 }}>
              <CalendarOutlined /> Lich cong viec AI
            </Title>
          </div>

          <div className="header-center">
            <Button icon={<LeftOutlined />} onClick={goToPreviousWeek} />
            <Button onClick={goToToday}>Hom nay</Button>
            <Button icon={<RightOutlined />} onClick={goToNextWeek} />
            <Text strong style={{ fontSize: 16, marginLeft: 16 }}>
              {weekDays[0].format("DD/MM")} - {weekDays[6].format("DD/MM/YYYY")}
            </Text>
          </div>

          <div className="header-right">
            <Select
              value={viewMode}
              onChange={setViewMode}
              style={{ width: 100 }}
            >
              <Option value="week">Tuan</Option>
              <Option value="day">Ngay</Option>
            </Select>
            <Button
              type="primary"
              icon={<RobotOutlined />}
              loading={aiLoading}
              onClick={analyzeSchedule}
            >
              AI Toi Uu Lich
            </Button>
          </div>
        </div>

        <Row gutter={16} className="calendar-stats">
          <Col span={6}>
            <Card size="small">
              <Statistic
                title="Cong viec tuan nay"
                value={totalTasks}
                prefix={<CalendarOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <Statistic
                title="Uu tien cao"
                value={highPriorityTasks}
                valueStyle={{ color: "#f5222d" }}
                prefix={<ClockCircleOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <Statistic
                title="Duoc AI ho tro"
                value={aiAssistedTasks}
                valueStyle={{ color: "#722ed1" }}
                prefix={<RobotOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <Statistic
                title="Da hoan thanh"
                value={
                  weekTasks.filter(
                    (e) => e.status === "completed" || e.status === "done",
                  ).length
                }
                valueStyle={{ color: "#52c41a" }}
                prefix={<CheckCircleOutlined />}
              />
            </Card>
          </Col>
        </Row>

        <Card className="calendar-card" loading={tasksLoading}>
          <div className="calendar-days-header">
            <div className="time-column-header">Gio</div>
            {weekDays.map((day, index) => (
              <div
                key={index}
                className={`day-header ${day.isSame(dayjs(), "day") ? "today" : ""}`}
              >
                <div className="day-name">{WEEK_DAYS[index]}</div>
                <div className="day-number">{day.format("DD")}</div>
              </div>
            ))}
          </div>

          <div className="calendar-time-grid">
            <div className="time-labels">
              {HOURS.filter((_, i) => i % 2 === 0).map((slot, i) => (
                <div key={i} className="time-label" style={{ top: i * 60 }}>
                  {slot.label}
                </div>
              ))}
            </div>

            {weekDays.map((day, dayIndex) => (
              <div
                key={dayIndex}
                className={`day-column ${day.isSame(dayjs(), "day") ? "today" : ""}`}
                onClick={() => setSelectedDate(day)}
              >
                {Array.from({ length: 24 }).map((_, hour) => (
                  <div key={hour} className="hour-cell" />
                ))}

                {(() => {
                  const positions = getOverlappingEvents(events, day);
                  return events
                    .filter((e) => isEventInDay(e, day))
                    .map((event) => {
                      const { top, height } = getEventPosition(event);
                      const pos = positions.get(event.id) || {
                        width: 98,
                        left: 1,
                      };
                      return (
                        <Tooltip
                          key={event.id}
                          title={
                            <div>
                              <strong>{event.title}</strong>
                              <br />
                              {event.start.format("HH:mm")} -{" "}
                              {event.end.format("HH:mm")}
                              {event.reason && (
                                <>
                                  <br />
                                  <em>{event.reason}</em>
                                </>
                              )}
                            </div>
                          }
                        >
                          <div
                            className={`calendar-event priority-${event.priority}`}
                            style={{
                              top: `${top}px`,
                              height: `${Math.min(height, 120)}px`,
                              width: `${pos.width}%`,
                              left: `${pos.left}%`,
                              backgroundColor: getPriorityColor(event.priority),
                              opacity:
                                event.status === "completed" ||
                                event.status === "done"
                                  ? 0.6
                                  : 1,
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/tasks?task=${event.id}`);
                            }}
                          >
                            <div className="event-title">{event.title}</div>
                            <div className="event-time">
                              {event.start.format("HH:mm")} -{" "}
                              {event.end.format("HH:mm")}
                            </div>
                            {event.aiScheduled && (
                              <RobotOutlined className="event-ai-icon" />
                            )}
                          </div>
                        </Tooltip>
                      );
                    });
                })()}

                {day.isSame(dayjs(), "day") && (
                  <div
                    className="current-time-line"
                    style={{
                      top: `${dayjs().hour() * 60 + dayjs().minute()}px`,
                    }}
                  />
                )}
              </div>
            ))}
          </div>
        </Card>

        {aiSchedule && (
          <Card
            className="ai-suggestions-panel"
            title={
              <>
                <BulbOutlined /> Goi y lich tu AI
              </>
            }
          >
            <Alert
              title={aiSchedule.personalizationNote}
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
            <div className="ai-schedule-preview">
              {aiSchedule.schedule.slice(0, 3).map((day, idx) => (
                <div key={idx} className="ai-day-preview">
                  <Text strong>
                    {day.day} ({day.date})
                  </Text>
                  <div className="ai-tasks-preview">
                    {day.tasks.slice(0, 3).map((task, tidx) => (
                      <Tag key={tidx} color="blue">
                        {task.suggestedTime}: {task.title}
                      </Tag>
                    ))}
                    {day.tasks.length > 3 && (
                      <Tag>+{day.tasks.length - 3} task khac</Tag>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <Button
              type="primary"
              block
              icon={<SyncOutlined />}
              onClick={() => setScheduleModalOpen(true)}
            >
              Xem chi tiet lich AI
            </Button>
          </Card>
        )}

        {!tasksLoading && events.length === 0 && (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <Space direction="vertical">
                <Text>Chua co cong viec nao tren lich</Text>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => navigate("/tasks")}
                >
                  Them cong viec
                </Button>
              </Space>
            }
          />
        )}
      </main>

      <Modal
        title={
          <Space>
            <RobotOutlined /> Lich trinh toi uu tu AI
          </Space>
        }
        open={scheduleModalOpen}
        onCancel={() => setScheduleModalOpen(false)}
        width={800}
        footer={[
          <Button key="close" onClick={() => setScheduleModalOpen(false)}>
            Dong
          </Button>,
          <Button key="apply" type="primary" icon={<CheckCircleOutlined />}>
            Ap dung lich trinh
          </Button>,
        ]}
      >
        {aiSchedule ? (
          <div className="ai-schedule-modal-content">
            <Alert
              title={`AI da phan tich ${aiSchedule.totalTasks} cong viec va tao lich trong ${aiSchedule.schedule.length} ngay`}
              message={aiSchedule.personalizationNote}
              type="success"
              showIcon
              style={{ marginBottom: 16 }}
            />
            {aiSchedule.schedule.map((day, idx) => (
              <div key={idx} className="ai-day-card">
                <Divider>
                  <Badge count={idx + 1} color="#4a90e2" />
                  <Text strong style={{ marginLeft: 8 }}>
                    {day.day}
                  </Text>
                  <Text type="secondary" style={{ marginLeft: 8 }}>
                    {day.date}
                  </Text>
                </Divider>
                <div className="ai-tasks-list">
                  {day.tasks.map((task, tidx) => (
                    <div key={tidx} className="ai-task-item">
                      <Tag color="blue">{task.suggestedTime}</Tag>
                      <Text strong>{task.title}</Text>
                      <Tag color={getPriorityColor(task.priority)}>
                        {task.priority}
                      </Tag>
                      <Tooltip title={task.reason}>
                        <BulbOutlined
                          style={{ color: "#faad14", marginLeft: 8 }}
                        />
                      </Tooltip>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Spin tip="Dang tai..." />
        )}
      </Modal>
    </div>
  );
}

export default Calendar;
