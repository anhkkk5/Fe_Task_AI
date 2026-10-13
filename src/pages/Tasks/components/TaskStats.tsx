import React from "react";
import { Row, Col, Card, Typography } from "antd";
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  ScheduleOutlined,
  UnorderedListOutlined,
} from "@ant-design/icons";
import type { TaskItem } from "../types";

const { Text } = Typography;

interface TaskStatsProps {
  tasks: TaskItem[];
}

export const TaskStats: React.FC<TaskStatsProps> = ({ tasks }) => {
  const total = tasks.length;
  const inProgress = tasks.filter((t) => t.status === "in_progress").length;
  const scheduled = tasks.filter((t) => t.status === "scheduled").length;
  const completed = tasks.filter((t) => t.status === "completed").length;

  const stats = [
    {
      title: "Tổng công việc",
      count: total,
      icon: <UnorderedListOutlined style={{ color: "#1677ff", fontSize: 22 }} />,
      bgColor: "rgba(22, 119, 255, 0.08)",
    },
    {
      title: "Đang thực hiện",
      count: inProgress,
      icon: <ClockCircleOutlined style={{ color: "#faad14", fontSize: 22 }} />,
      bgColor: "rgba(250, 173, 20, 0.08)",
    },
    {
      title: "Đã lên lịch",
      count: scheduled,
      icon: <ScheduleOutlined style={{ color: "#52c41a", fontSize: 22 }} />,
      bgColor: "rgba(82, 196, 26, 0.08)",
    },
    {
      title: "Đã hoàn thành",
      count: completed,
      icon: <CheckCircleOutlined style={{ color: "#13c2c2", fontSize: 22 }} />,
      bgColor: "rgba(19, 194, 194, 0.08)",
    },
  ];

  return (
    <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
      {stats.map((item, idx) => (
        <Col xs={12} sm={6} key={idx}>
          <Card
            bordered={false}
            bodyStyle={{ padding: "16px 20px" }}
            style={{
              borderRadius: 12,
              background: "#ffffff",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <Text type="secondary" style={{ fontSize: 13, display: "block" }}>
                  {item.title}
                </Text>
                <span style={{ fontSize: 24, fontWeight: 700, color: "#1e293b" }}>
                  {item.count}
                </span>
              </div>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: "50%",
                  background: item.bgColor,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {item.icon}
              </div>
            </div>
          </Card>
        </Col>
      ))}
    </Row>
  );
};
