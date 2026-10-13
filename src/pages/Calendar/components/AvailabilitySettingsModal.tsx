import React, { useEffect, useMemo, useState } from "react";
import {
  Button,
  DatePicker,
  Divider,
  Modal,
  Space,
  Tabs,
  TimePicker,
  Typography,
  message,
  Form,
  Input,
  Checkbox,
  Tag,
  Popconfirm,
  Spin,
} from "antd";
import {
  DeleteOutlined,
  PlusOutlined,
  EditOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import {
  deleteCustomDateAvailability,
  getMyAvailability,
  setCustomDateAvailability,
  updateWeeklyAvailability,
  type AvailableTimeSlot,
  type WeeklyPattern,
} from "../../../services/freeTimeServices";
import {
  getRoutines,
  createRoutine,
  updateRoutine,
  deleteRoutine,
  type DailyRoutineItem,
} from "../../../services/routineServices";

const { Text } = Typography;

const DAY_KEYS: Array<keyof WeeklyPattern> = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

const DAY_LABELS: Record<keyof WeeklyPattern, string> = {
  monday: "Thứ 2",
  tuesday: "Thứ 3",
  wednesday: "Thứ 4",
  thursday: "Thứ 5",
  friday: "Thứ 6",
  saturday: "Thứ 7",
  sunday: "Chủ nhật",
};

const EMPTY_WEEKLY_PATTERN: WeeklyPattern = {
  monday: [],
  tuesday: [],
  wednesday: [],
  thursday: [],
  friday: [],
  saturday: [],
  sunday: [],
};

interface AvailabilitySettingsModalProps {
  open: boolean;
  onCancel: () => void;
  onRoutinesChanged?: () => void;
}

const normalizeSlots = (slots: AvailableTimeSlot[]) =>
  [...slots].sort((a, b) => a.start.localeCompare(b.start));

const COLOR_OPTIONS = [
  { label: "Xanh ngọc", value: "#10b981" },
  { label: "Xanh lá", value: "#22c55e" },
  { label: "Xanh dương", value: "#06b6d4" },
  { label: "Vàng chanh", value: "#eab308" },
  { label: "Cam", value: "#f97316" },
  { label: "Đỏ", value: "#ef4444" },
  { label: "Tím", value: "#8b5cf6" },
];

export const AvailabilitySettingsModal: React.FC<
  AvailabilitySettingsModalProps
> = ({ open, onCancel, onRoutinesChanged }) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [weeklyPattern, setWeeklyPattern] =
    useState<WeeklyPattern>(EMPTY_WEEKLY_PATTERN);
  const [timezone, setTimezone] = useState("Asia/Ho_Chi_Minh");

  const [customDate, setCustomDate] = useState<dayjs.Dayjs | null>(null);
  const [customDateSlots, setCustomDateSlots] = useState<AvailableTimeSlot[]>(
    [],
  );
  const [customDateLoading, setCustomDateLoading] = useState(false);

  // Daily Routines State
  const [routinesList, setRoutinesList] = useState<DailyRoutineItem[]>([]);
  const [loadingRoutines, setLoadingRoutines] = useState(false);
  const [routineModalOpen, setRoutineModalOpen] = useState(false);
  const [editingRoutine, setEditingRoutine] = useState<DailyRoutineItem | null>(null);
  const [routineSubmitting, setRoutineSubmitting] = useState(false);
  const [routineForm] = Form.useForm();

  const customDateKey = useMemo(
    () => (customDate ? customDate.format("YYYY-MM-DD") : ""),
    [customDate],
  );

  const loadAvailability = async () => {
    setLoading(true);
    try {
      const res = await getMyAvailability();
      if (res.availability) {
        setWeeklyPattern(
          res.availability.weeklyPattern || EMPTY_WEEKLY_PATTERN,
        );
        setTimezone(res.availability.timezone || "Asia/Ho_Chi_Minh");
      } else {
        setWeeklyPattern(EMPTY_WEEKLY_PATTERN);
        setTimezone("Asia/Ho_Chi_Minh");
      }
    } catch (error: any) {
      message.error(error?.message || "Không thể tải lịch rảnh");
    } finally {
      setLoading(false);
    }
  };

  const loadRoutinesList = async () => {
    try {
      setLoadingRoutines(true);
      const res = await getRoutines();
      setRoutinesList(res.routines || []);
    } catch {
      // silent
    } finally {
      setLoadingRoutines(false);
    }
  };

  useEffect(() => {
    if (open) {
      void loadAvailability();
      void loadRoutinesList();
    }
  }, [open]);

  useEffect(() => {
    if (!customDateKey) {
      setCustomDateSlots([]);
      return;
    }

    setCustomDateLoading(true);
    getMyAvailability()
      .then((res) => {
        const found = (res.availability?.customDates || []).find(
          (c) => c.date === customDateKey,
        );
        const slots = found?.slots || [];
        setCustomDateSlots(slots);
      })
      .catch(() => {
        setCustomDateSlots([]);
      })
      .finally(() => {
        setCustomDateLoading(false);
      });
  }, [customDateKey]);

  const updateSlot = (
    target: keyof WeeklyPattern | "custom",
    index: number,
    field: "start" | "end",
    val: string,
  ) => {
    if (target === "custom") {
      setCustomDateSlots((prev) => {
        const next = [...prev];
        next[index] = { ...next[index], [field]: val };
        return next;
      });
      return;
    }

    setWeeklyPattern((prev) => {
      const daySlots = [...(prev[target] || [])];
      daySlots[index] = { ...daySlots[index], [field]: val };
      return { ...prev, [target]: daySlots };
    });
  };

  const addSlot = (target: keyof WeeklyPattern | "custom") => {
    const newSlot: AvailableTimeSlot = { start: "09:00", end: "12:00" };
    if (target === "custom") {
      setCustomDateSlots((prev) => [...prev, newSlot]);
      return;
    }
    setWeeklyPattern((prev) => ({
      ...prev,
      [target]: [...(prev[target] || []), newSlot],
    }));
  };

  const removeSlot = (
    target: keyof WeeklyPattern | "custom",
    index: number,
  ) => {
    if (target === "custom") {
      setCustomDateSlots((prev) => prev.filter((_, idx) => idx !== index));
      return;
    }
    setWeeklyPattern((prev) => ({
      ...prev,
      [target]: (prev[target] || []).filter((_, idx) => idx !== index),
    }));
  };

  const handleSaveWeekly = async () => {
    setSaving(true);
    try {
      const normalized: WeeklyPattern = {} as WeeklyPattern;
      for (const key of DAY_KEYS) {
        normalized[key] = normalizeSlots(weeklyPattern[key] || []);
      }
      await updateWeeklyAvailability({ weeklyPattern: normalized, timezone });
      setWeeklyPattern(normalized);
      message.success("Đã lưu lịch rảnh theo tuần");
    } catch (error: any) {
      message.error(error?.message || "Không thể lưu lịch rảnh");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveCustomDate = async () => {
    if (!customDateKey) return;
    setSaving(true);
    try {
      const sorted = normalizeSlots(customDateSlots);
      await setCustomDateAvailability(customDateKey, sorted);
      setCustomDateSlots(sorted);
      message.success("Đã lưu lịch rảnh theo ngày");
    } catch (error: any) {
      message.error(error?.message || "Không thể lưu lịch rảnh theo ngày");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCustomDate = async () => {
    if (!customDateKey) return;
    setSaving(true);
    try {
      await deleteCustomDateAvailability(customDateKey);
      setCustomDateSlots([]);
      message.success("Đã xóa lịch ngày tùy chỉnh");
    } catch (error: any) {
      message.error(error?.message || "Không thể xóa lịch ngày tùy chỉnh");
    } finally {
      setSaving(false);
    }
  };

  // Routine Handlers
  const handleOpenCreateRoutine = () => {
    setEditingRoutine(null);
    routineForm.resetFields();
    routineForm.setFieldsValue({
      timeRange: [dayjs("06:30", "HH:mm"), dayjs("07:00", "HH:mm")],
      daysOfWeek: [1, 2, 3, 4, 5, 6, 7],
      color: "#10b981",
    });
    setRoutineModalOpen(true);
  };

  const handleOpenEditRoutine = (r: DailyRoutineItem) => {
    setEditingRoutine(r);
    routineForm.setFieldsValue({
      title: r.title,
      description: r.description,
      timeRange: [dayjs(r.startTime, "HH:mm"), dayjs(r.endTime, "HH:mm")],
      daysOfWeek: r.daysOfWeek || [1, 2, 3, 4, 5, 6, 7],
      color: r.color || "#10b981",
    });
    setRoutineModalOpen(true);
  };

  const handleSaveRoutine = async () => {
    try {
      const values = await routineForm.validateFields();
      setRoutineSubmitting(true);
      const startTime = values.timeRange[0].format("HH:mm");
      const endTime = values.timeRange[1].format("HH:mm");

      if (editingRoutine) {
        await updateRoutine(editingRoutine._id, {
          title: values.title,
          description: values.description,
          startTime,
          endTime,
          daysOfWeek: values.daysOfWeek,
          color: values.color,
        });
        message.success("Đã cập nhật lịch lặp lại");
      } else {
        await createRoutine({
          title: values.title,
          description: values.description,
          startTime,
          endTime,
          daysOfWeek: values.daysOfWeek,
          color: values.color,
        });
        message.success("Đã tạo lịch lặp lại mới");
      }
      setRoutineModalOpen(false);
      await loadRoutinesList();
      onRoutinesChanged?.();
    } catch (err: any) {
      if (err?.errorFields) return;
      message.error(err?.message || "Không thể lưu lịch lặp lại");
    } finally {
      setRoutineSubmitting(false);
    }
  };

  const handleDeleteRoutine = async (id: string) => {
    try {
      await deleteRoutine(id);
      message.success("Đã xóa lịch lặp lại");
      await loadRoutinesList();
      onRoutinesChanged?.();
    } catch (err: any) {
      message.error(err?.message || "Không thể xóa lịch lặp lại");
    }
  };

  const renderSlots = (
    slots: AvailableTimeSlot[],
    target: keyof WeeklyPattern | "custom",
  ) => (
    <Space direction="vertical" style={{ width: "100%" }} size={8}>
      {slots.map((slot, idx) => (
        <Space key={`${slot.start}-${slot.end}-${idx}`} align="center">
          <TimePicker
            format="HH:mm"
            minuteStep={15}
            value={dayjs(slot.start, "HH:mm")}
            onChange={(_, timeStr) =>
              updateSlot(target, idx, "start", String(timeStr || "00:00"))
            }
          />
          <Text>-</Text>
          <TimePicker
            format="HH:mm"
            minuteStep={15}
            value={dayjs(slot.end, "HH:mm")}
            onChange={(_, timeStr) =>
              updateSlot(target, idx, "end", String(timeStr || "00:00"))
            }
          />
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            onClick={() => removeSlot(target, idx)}
          />
        </Space>
      ))}

      <Button
        type="dashed"
        icon={<PlusOutlined />}
        onClick={() => addSlot(target)}
      >
        Thêm khung giờ
      </Button>
    </Space>
  );

  return (
    <Modal
      title="Cài đặt Lịch rảnh & Lịch lặp lại cá nhân"
      open={open}
      onCancel={onCancel}
      width={860}
      footer={null}
      destroyOnClose
    >
      <Tabs
        defaultActiveKey="routines"
        items={[
          {
            key: "routines",
            label: "🔁 Lịch lặp lại hàng ngày (Daily Routines)",
            children: (
              <div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 12,
                  }}
                >
                  <div>
                    <Text strong style={{ fontSize: 15 }}>
                      Thói quen sinh hoạt & Lịch cố định lặp lại
                    </Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: 13 }}>
                      Mỗi thói quen chỉ lưu đúng 1 dòng trong CSDL, tự động hiển thị trên Lịch cả tuần mà KHÔNG làm phình danh sách công việc!
                    </Text>
                  </div>
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={handleOpenCreateRoutine}
                    style={{ background: "#10b981", borderColor: "#10b981" }}
                  >
                    Thêm lịch lặp lại
                  </Button>
                </div>
                <Divider style={{ margin: "8px 0 16px 0" }} />

                <Spin spinning={loadingRoutines}>
                  <Space
                    direction="vertical"
                    style={{ width: "100%", maxHeight: 420, overflowY: "auto" }}
                    size={12}
                  >
                    {routinesList.length === 0 ? (
                      <div style={{ textAlign: "center", padding: "30px 0" }}>
                        <Text type="secondary">Chưa có lịch lặp lại nào. Hãy bấm nút thêm ở trên!</Text>
                      </div>
                    ) : (
                      routinesList.map((r) => {
                        const daysText =
                          (r.daysOfWeek || []).length === 7
                            ? "Hàng ngày (T2 - CN)"
                            : (r.daysOfWeek || [])
                                .map((d) => (d === 7 ? "CN" : `T${d + 1}`))
                                .join(", ");
                        return (
                          <div
                            key={r._id}
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              border: "1px solid #e5e7eb",
                              borderLeft: `5px solid ${r.color || "#10b981"}`,
                              borderRadius: 8,
                              padding: "12px 16px",
                              background: "#fafafa",
                            }}
                          >
                            <div>
                              <Space align="center">
                                <span
                                  style={{
                                    display: "inline-block",
                                    width: 10,
                                    height: 10,
                                    borderRadius: "50%",
                                    backgroundColor: r.color || "#10b981",
                                  }}
                                />
                                <Text strong style={{ fontSize: 14 }}>
                                  {r.title}
                                </Text>
                                <Tag color="cyan">
                                  <ClockCircleOutlined /> {r.startTime} - {r.endTime}
                                </Tag>
                                <Tag color="blue">{daysText}</Tag>
                              </Space>
                              {r.description && (
                                <div style={{ marginTop: 4, color: "#6b7280", fontSize: 12 }}>
                                  {r.description}
                                </div>
                              )}
                            </div>
                            <Space>
                              <Button
                                size="small"
                                icon={<EditOutlined />}
                                onClick={() => handleOpenEditRoutine(r)}
                              >
                                Sửa
                              </Button>
                              <Popconfirm
                                title="Xác nhận xóa lịch lặp lại này?"
                                onConfirm={() => handleDeleteRoutine(r._id)}
                                okText="Xóa"
                                cancelText="Hủy"
                                okButtonProps={{ danger: true }}
                              >
                                <Button size="small" danger icon={<DeleteOutlined />} />
                              </Popconfirm>
                            </Space>
                          </div>
                        );
                      })
                    )}
                  </Space>
                </Spin>
              </div>
            ),
          },
          {
            key: "weekly",
            label: "Lịch rảnh theo tuần",
            children: (
              <div>
                <Text type="secondary">
                  Thiết lập các khoảng thời gian rảnh rỗi phục vụ cho thuật toán AI xếp lịch.
                </Text>
                <Divider style={{ margin: "12px 0" }} />
                <Space
                  direction="vertical"
                  style={{ width: "100%", maxHeight: 380, overflowY: "auto" }}
                  size={12}
                >
                  {DAY_KEYS.map((day) => (
                    <div
                      key={day}
                      style={{
                        border: "1px solid #f0f0f0",
                        borderRadius: 8,
                        padding: 12,
                      }}
                    >
                      <Text strong>{DAY_LABELS[day]}</Text>
                      <div style={{ marginTop: 8 }}>
                        {renderSlots(weeklyPattern[day] || [], day)}
                      </div>
                    </div>
                  ))}
                </Space>

                <div style={{ marginTop: 16, textAlign: "right" }}>
                  <Button
                    loading={saving || loading}
                    type="primary"
                    onClick={handleSaveWeekly}
                  >
                    Lưu lịch tuần
                  </Button>
                </div>
              </div>
            ),
          },
          {
            key: "customDate",
            label: "Override theo ngày",
            children: (
              <div>
                <Space
                  direction="vertical"
                  style={{ width: "100%" }}
                  size={12}
                >
                  <Space>
                    <Text>Chọn ngày:</Text>
                    <DatePicker
                      value={customDate}
                      onChange={setCustomDate}
                      format="DD/MM/YYYY"
                    />
                  </Space>

                  {customDateKey ? (
                    <>
                      <Text type="secondary">
                        Ngày {customDate?.format("DD/MM/YYYY")} sẽ ghi đè lịch tuần.
                      </Text>
                      <div style={{ opacity: customDateLoading ? 0.6 : 1 }}>
                        {renderSlots(customDateSlots, "custom")}
                      </div>
                      <Space
                        style={{ justifyContent: "flex-end", width: "100%" }}
                      >
                        <Button
                          danger
                          onClick={handleDeleteCustomDate}
                          loading={saving}
                        >
                          Xóa override ngày
                        </Button>
                        <Button
                          type="primary"
                          onClick={handleSaveCustomDate}
                          loading={saving}
                        >
                          Lưu override ngày
                        </Button>
                      </Space>
                    </>
                  ) : (
                    <Text type="secondary">
                      Chọn ngày để chỉnh sửa khung giờ rảnh.
                    </Text>
                  )}
                </Space>
              </div>
            ),
          },
        ]}
      />

      {/* Sub-modal Create/Edit Routine */}
      <Modal
        title={editingRoutine ? "Chỉnh sửa lịch lặp lại hàng ngày" : "Thêm lịch lặp lại hàng ngày mới"}
        open={routineModalOpen}
        onCancel={() => setRoutineModalOpen(false)}
        onOk={handleSaveRoutine}
        confirmLoading={routineSubmitting}
        destroyOnClose
        okText={editingRoutine ? "Cập nhật" : "Tạo mới"}
        cancelText="Hủy"
      >
        <Form form={routineForm} layout="vertical">
          <Form.Item
            name="title"
            label="Tên thói quen / Hoạt động sinh hoạt"
            rules={[{ required: true, message: "Vui lòng nhập tên hoạt động" }]}
          >
            <Input placeholder="VD: Dậy đánh răng rửa mặt, Tập thể dục, Ăn sáng, Đi làm..." />
          </Form.Item>

          <Form.Item name="description" label="Ghi chú thêm">
            <Input placeholder="Mô tả chi tiết hoặc địa điểm..." />
          </Form.Item>

          <Form.Item
            name="timeRange"
            label="Khung giờ (Bắt đầu - Kết thúc)"
            rules={[{ required: true, message: "Vui lòng chọn khung giờ" }]}
          >
            <TimePicker.RangePicker format="HH:mm" minuteStep={5} style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item
            name="daysOfWeek"
            label="Các ngày lặp lại trong tuần"
            rules={[{ required: true, message: "Vui lòng chọn ít nhất 1 ngày" }]}
          >
            <Checkbox.Group
              options={[
                { label: "Thứ 2", value: 1 },
                { label: "Thứ 3", value: 2 },
                { label: "Thứ 4", value: 3 },
                { label: "Thứ 5", value: 4 },
                { label: "Thứ 6", value: 5 },
                { label: "Thứ 7", value: 6 },
                { label: "Chủ Nhật", value: 7 },
              ]}
            />
          </Form.Item>

          <Form.Item name="color" label="Màu sắc hiển thị trên Lịch">
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {COLOR_OPTIONS.map((c) => (
                <Form.Item noStyle key={c.value}>
                  <Button
                    size="small"
                    style={{
                      backgroundColor: c.value,
                      color: "#fff",
                      border: "none",
                      borderRadius: 4,
                    }}
                    onClick={() => routineForm.setFieldsValue({ color: c.value })}
                  >
                    {c.label}
                  </Button>
                </Form.Item>
              ))}
            </div>
          </Form.Item>
        </Form>
      </Modal>
    </Modal>
  );
};
