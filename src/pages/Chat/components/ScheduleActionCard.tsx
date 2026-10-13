import React, { useState } from "react";
import { Button, Checkbox, Tag, message } from "antd";
import {
  CalendarOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  SwapOutlined,
  ThunderboltOutlined,
  ClockCircleOutlined,
  CheckOutlined,
} from "@ant-design/icons";
import {
  applyCalendarAction,
  type ScheduleActionPayload,
  type ScheduleActionItem,
} from "../../../services/chatServices";
import "./ScheduleActionCard.scss";

interface ScheduleActionCardProps {
  action: ScheduleActionPayload;
  onApplied?: () => void;
}

export const ScheduleActionCard: React.FC<ScheduleActionCardProps> = ({
  action,
  onApplied,
}) => {
  const [items, setItems] = useState<ScheduleActionItem[]>(() =>
    (action.actions || []).map((item) => ({
      ...item,
      checked: item.checked !== false,
    }))
  );
  const [loading, setLoading] = useState(false);
  const [applied, setApplied] = useState(false);

  const toggleItem = (index: number) => {
    if (applied) return;
    setItems((prev) =>
      prev.map((item, idx) =>
        idx === index ? { ...item, checked: !item.checked } : item
      )
    );
  };

  const handleApply = async () => {
    if (loading || applied) return;
    const selectedItems = items.filter((i) => i.checked);
    if (selectedItems.length === 0) {
      message.warning("Vui lòng chọn ít nhất 1 mục để áp dụng lên lịch!");
      return;
    }

    setLoading(true);
    try {
      const res = await applyCalendarAction({
        targetDate: action.targetDate,
        actions: selectedItems,
      });

      if (res.success) {
        setApplied(true);
        message.success(res.message || "Đã áp dụng lên lịch trình thành công!");

        // Dispatch events so Calendar and Tasks update instantly
        window.dispatchEvent(
          new CustomEvent("ai-tasks-created", {
            detail: { count: res.appliedCount },
          })
        );
        window.dispatchEvent(
          new CustomEvent("calendar-updated", {
            detail: { date: action.targetDate },
          })
        );

        onApplied?.();
      } else {
        message.error(res.message || "Áp dụng thất bại, vui lòng thử lại!");
      }
    } catch (err: any) {
      message.error(err?.message || "Có lỗi xảy ra khi cập nhật lịch!");
    } finally {
      setLoading(false);
    }
  };

  const renderBadge = (item: ScheduleActionItem) => {
    switch (item.action) {
      case "cancel_routine":
        return (
          <Tag color="error" className="action-tag cancel-tag">
            <CloseCircleOutlined /> Bỏ thói quen
          </Tag>
        );
      case "replace":
        return (
          <Tag color="warning" className="action-tag replace-tag">
            <SwapOutlined /> Thay thế
          </Tag>
        );
      case "create_event":
      case "create":
        if (item.taskId) {
          return (
            <Tag color="processing" className="action-tag task-tag">
              <ThunderboltOutlined /> Nhặt task tồn
            </Tag>
          );
        }
        return (
          <Tag color="success" className="action-tag create-tag">
            <CalendarOutlined /> Lên lịch mới
          </Tag>
        );
      default:
        return (
          <Tag color="default" className="action-tag">
            <ClockCircleOutlined /> Lịch trình
          </Tag>
        );
    }
  };

  const selectedCount = items.filter((i) => i.checked).length;

  return (
    <div className={`schedule-action-card ${applied ? "is-applied" : ""}`}>
      {/* Header */}
      <div className="card-header">
        <div className="header-left">
          <div className="header-icon-wrap">
            <CalendarOutlined className="header-icon" />
          </div>
          <div className="header-titles">
            <div className="card-title">
              Điều phối Lịch trình & Thói quen
              {action.targetDayVi && (
                <span className="target-day-badge">{action.targetDayVi}</span>
              )}
            </div>
            {action.summary && (
              <div className="card-summary">{action.summary}</div>
            )}
          </div>
        </div>
        {applied && (
          <div className="applied-pill">
            <CheckCircleOutlined /> Đã áp dụng
          </div>
        )}
      </div>

      {/* Items list */}
      <div className="card-items-list">
        {items.map((item, index) => {
          const isCancel = item.action === "cancel_routine";
          const isReplace = item.action === "replace";

          return (
            <div
              key={index}
              className={`action-item ${item.checked ? "checked" : "unchecked"} ${
                isCancel ? "is-cancel" : ""
              }`}
              onClick={() => toggleItem(index)}
            >
              <div className="item-checkbox-wrap" onClick={(e) => e.stopPropagation()}>
                <Checkbox
                  checked={item.checked}
                  disabled={applied}
                  onChange={() => toggleItem(index)}
                />
              </div>

              <div className="item-content">
                <div className="item-top-row">
                  {renderBadge(item)}
                  {item.time && (
                    <span className="item-time">
                      <ClockCircleOutlined /> {item.time}
                    </span>
                  )}
                </div>

                <div className="item-main-row">
                  {isReplace ? (
                    <div className="replace-titles">
                      {item.oldTitle && (
                        <span className="old-title-strike">{item.oldTitle}</span>
                      )}
                      <span className="arrow-sep">➔</span>
                      <span className="new-title-strong">
                        {item.newTitle || item.title}
                      </span>
                    </div>
                  ) : isCancel ? (
                    <div className="cancel-title">
                      <span className="cancelled-text">{item.title}</span>
                      {item.reason && (
                        <span className="item-reason">({item.reason})</span>
                      )}
                    </div>
                  ) : (
                    <div className="normal-title">
                      <span className="title-text">{item.title}</span>
                      {item.reason && (
                        <span className="item-reason">— {item.reason}</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="card-footer">
        <div className="footer-status">
          {applied ? (
            <span className="status-text success">
              <CheckOutlined /> Lịch trình đã được cập nhật vào Calendar của bạn.
            </span>
          ) : (
            <span className="status-text">
              Đã chọn <strong>{selectedCount}</strong> / {items.length} mục
            </span>
          )}
        </div>

        <div className="footer-actions">
          {applied ? (
            <Button
              type="primary"
              className="apply-btn applied"
              icon={<CheckCircleOutlined />}
              disabled
            >
              Đã lên lịch thành công
            </Button>
          ) : (
            <Button
              type="primary"
              className="apply-btn"
              icon={<ThunderboltOutlined />}
              loading={loading}
              onClick={handleApply}
              disabled={selectedCount === 0}
            >
              ✨ Áp dụng lên lịch ngay
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
