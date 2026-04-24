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
} from "antd";
import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import {
  deleteCustomDateAvailability,
  getMyAvailability,
  setCustomDateAvailability,
  updateWeeklyAvailability,
  type AvailableTimeSlot,
  type WeeklyPattern,
} from "../../../services/freeTimeServices";

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
}

const normalizeSlots = (slots: AvailableTimeSlot[]) =>
  [...slots].sort((a, b) => a.start.localeCompare(b.start));

export const AvailabilitySettingsModal: React.FC<
  AvailabilitySettingsModalProps
> = ({ open, onCancel }) => {
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

  useEffect(() => {
    if (!open) return;
    loadAvailability();
  }, [open]);

  useEffect(() => {
    if (!open || !customDate) return;
    setCustomDateLoading(true);
    getMyAvailability()
      .then((res) => {
        const slot =
          res.availability?.customDates?.find((x) => x.date === customDateKey)
            ?.slots || [];
        setCustomDateSlots(normalizeSlots(slot));
      })
      .catch(() => {
        setCustomDateSlots([]);
      })
      .finally(() => setCustomDateLoading(false));
  }, [customDate, customDateKey, open]);

  const addSlot = (
    target: keyof WeeklyPattern | "custom",
    defaultStart = "20:00",
    defaultEnd = "21:00",
  ) => {
    if (target === "custom") {
      setCustomDateSlots((prev) =>
        normalizeSlots([...prev, { start: defaultStart, end: defaultEnd }]),
      );
      return;
    }
    setWeeklyPattern((prev) => ({
      ...prev,
      [target]: normalizeSlots([
        ...(prev[target] || []),
        { start: defaultStart, end: defaultEnd },
      ]),
    }));
  };

  const removeSlot = (
    target: keyof WeeklyPattern | "custom",
    index: number,
  ) => {
    if (target === "custom") {
      setCustomDateSlots((prev) => prev.filter((_, i) => i !== index));
      return;
    }
    setWeeklyPattern((prev) => ({
      ...prev,
      [target]: (prev[target] || []).filter((_, i) => i !== index),
    }));
  };

  const changeSlot = (
    target: keyof WeeklyPattern | "custom",
    index: number,
    key: "start" | "end",
    value: string,
  ) => {
    if (target === "custom") {
      setCustomDateSlots((prev) => {
        const next = [...prev];
        next[index] = { ...next[index], [key]: value };
        return normalizeSlots(next);
      });
      return;
    }
    setWeeklyPattern((prev) => {
      const daySlots = [...(prev[target] || [])];
      daySlots[index] = { ...daySlots[index], [key]: value };
      return {
        ...prev,
        [target]: normalizeSlots(daySlots),
      };
    });
  };

  const handleSaveWeekly = async () => {
    setSaving(true);
    try {
      await updateWeeklyAvailability({ weeklyPattern, timezone });
      message.success("Đã lưu lịch rảnh theo tuần");
    } catch (error: any) {
      message.error(error?.message || "Không thể lưu lịch rảnh");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveCustomDate = async () => {
    if (!customDateKey) {
      message.warning("Vui lòng chọn ngày");
      return;
    }
    setSaving(true);
    try {
      await setCustomDateAvailability(customDateKey, customDateSlots);
      message.success("Đã lưu lịch rảnh theo ngày");
    } catch (error: any) {
      message.error(error?.message || "Không thể lưu override theo ngày");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCustomDate = async () => {
    if (!customDateKey) {
      message.warning("Vui lòng chọn ngày");
      return;
    }
    setSaving(true);
    try {
      await deleteCustomDateAvailability(customDateKey);
      setCustomDateSlots([]);
      message.success("Đã xóa override ngày");
    } catch (error: any) {
      message.error(error?.message || "Không thể xóa override");
    } finally {
      setSaving(false);
    }
  };

  const renderSlots = (
    slots: AvailableTimeSlot[],
    target: keyof WeeklyPattern | "custom",
  ) => (
    <Space orientation="vertical" style={{ width: "100%" }}>
      {slots.map((slot, idx) => (
        <Space
          key={`${target}-${idx}`}
          style={{ width: "100%", justifyContent: "space-between" }}
        >
          <Space>
            <TimePicker
              value={dayjs(slot.start, "HH:mm")}
              format="HH:mm"
              minuteStep={5}
              onChange={(val) =>
                changeSlot(
                  target,
                  idx,
                  "start",
                  val ? val.format("HH:mm") : "00:00",
                )
              }
            />
            <Text>-</Text>
            <TimePicker
              value={dayjs(slot.end, "HH:mm")}
              format="HH:mm"
              minuteStep={5}
              onChange={(val) =>
                changeSlot(
                  target,
                  idx,
                  "end",
                  val ? val.format("HH:mm") : "00:00",
                )
              }
            />
          </Space>
          <Button
            danger
            type="text"
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
      title="Lịch rảnh cá nhân"
      open={open}
      onCancel={onCancel}
      width={820}
      footer={null}
      destroyOnClose
    >
      <Tabs
        items={[
          {
            key: "weekly",
            label: "Lịch theo tuần",
            children: (
              <div>
                <Text type="secondary">
                  Thiết lập khung giờ rảnh cho từng ngày trong tuần.
                </Text>
                <Divider style={{ margin: "12px 0" }} />
                <Space
                  orientation="vertical"
                  style={{ width: "100%" }}
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
                  orientation="vertical"
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
                        Ngày {customDate?.format("DD/MM/YYYY")} sẽ ghi đè lịch
                        tuần.
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
    </Modal>
  );
};
