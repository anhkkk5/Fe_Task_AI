import React, { useState, useEffect } from "react";
import { Modal, Button, Space, TimePicker, message } from "antd";
import dayjs from "dayjs";
import type { CalendarEvent } from "../types";
import { useNavigate } from "react-router-dom";

interface EventDetailModalProps {
  event: CalendarEvent | null;
  open: boolean;
  onCancel: () => void;
  onSaveTime: (
    event: CalendarEvent,
    start: dayjs.Dayjs,
    end: dayjs.Dayjs,
  ) => Promise<void>;
  onDelete: (event: CalendarEvent) => Promise<void>;
}

export const EventDetailModal: React.FC<EventDetailModalProps> = ({
  event,
  open,
  onCancel,
  onSaveTime,
  onDelete,
}) => {
  const navigate = useNavigate();
  const [savingEventTime, setSavingEventTime] = useState(false);
  const [deletingEvent, setDeletingEvent] = useState(false);
  const [editEventStart, setEditEventStart] = useState<dayjs.Dayjs | null>(
    null,
  );
  const [editEventEnd, setEditEventEnd] = useState<dayjs.Dayjs | null>(null);

  useEffect(() => {
    if (event && open) {
      setEditEventStart(event.start);
      setEditEventEnd(event.end);
    }
  }, [event, open]);

  const handleSave = async () => {
    if (!event) return;
    if (!editEventStart || !editEventEnd) {
      message.error("Vui lòng chọn thời gian bắt đầu và kết thúc");
      return;
    }

    const start = event.start
      .clone()
      .hour(editEventStart.hour())
      .minute(editEventStart.minute())
      .second(0);
    const end = event.end
      .clone()
      .hour(editEventEnd.hour())
      .minute(editEventEnd.minute())
      .second(0);

    if (!end.isAfter(start)) {
      message.error("Giờ kết thúc phải sau giờ bắt đầu");
      return;
    }

    setSavingEventTime(true);
    try {
      await onSaveTime(event, start, end);
    } finally {
      setSavingEventTime(false);
    }
  };

  const handleDelete = async () => {
    if (!event) return;
    setDeletingEvent(true);
    try {
      await onDelete(event);
    } finally {
      setDeletingEvent(false);
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onCancel}
      title={event?.title || "Sự kiện"}
      footer={
        <Space>
          {event && !event.sessionId && (
            <Button
              onClick={() => {
                onCancel();
                navigate(`/tasks?task=${event.id}`);
              }}
            >
              Mở task
            </Button>
          )}
          <Button type="primary" loading={savingEventTime} onClick={handleSave}>
            Lưu thời gian
          </Button>
          <Button danger loading={deletingEvent} onClick={handleDelete}>
            Xóa
          </Button>
          <Button onClick={onCancel}>Đóng</Button>
        </Space>
      }
    >
      {event && (
        <div>
          <div>
            <strong>Thời gian:</strong> {event.start.format("HH:mm")} -{" "}
            {event.end.format("HH:mm")}
          </div>
          <div style={{ marginTop: 12 }}>
            <Space>
              <div>
                <div style={{ fontWeight: 600, marginBottom: 6 }}>Bắt đầu</div>
                <TimePicker
                  value={editEventStart}
                  onChange={setEditEventStart}
                  format="HH:mm"
                  minuteStep={5}
                  allowClear={false}
                />
              </div>
              <div>
                <div style={{ fontWeight: 600, marginBottom: 6 }}>Kết thúc</div>
                <TimePicker
                  value={editEventEnd}
                  onChange={setEditEventEnd}
                  format="HH:mm"
                  minuteStep={5}
                  allowClear={false}
                />
              </div>
            </Space>
          </div>
          <div style={{ marginTop: 12 }}>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>
              Nhiệm vụ trong phiên
            </div>
            <div style={{ display: "grid", gap: 4 }}>
              {(event.sessionTasks && event.sessionTasks.length > 0
                ? event.sessionTasks
                : [
                    {
                      title: event.title,
                      minutes: Math.max(
                        1,
                        event.end.diff(event.start, "minute"),
                      ),
                    },
                  ]
              ).map((item, index) => (
                <div key={`${item.title}-${index}`} style={{ fontSize: 13 }}>
                  • {item.title}
                  {item.minutes ? ` (${item.minutes} phút)` : ""}
                  {item.description ? ` - ${item.description}` : ""}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
};
