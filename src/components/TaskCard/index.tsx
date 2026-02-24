import { Card, Tag, Typography, Space, Button, Popconfirm } from "antd";
import { EditOutlined, DeleteOutlined, CalendarOutlined } from "@ant-design/icons";
import type { Task } from "../../services/taskServices";

const { Text } = Typography;

interface TaskCardProps {
  task: Task;
  onEdit?: (task: Task) => void;
  onDelete?: (taskId: string) => void;
}

const priorityColors: Record<string, string> = {
  low: "default",
  medium: "warning",
  high: "error",
};

const priorityLabels: Record<string, string> = {
  low: "Thấp",
  medium: "Trung bình",
  high: "Cao",
};

const statusColors: Record<string, string> = {
  pending: "default",
  in_progress: "processing",
  completed: "success",
  cancelled: "error",
};

const statusLabels: Record<string, string> = {
  pending: "Chờ xử lý",
  in_progress: "Đang thực hiện",
  completed: "Hoàn thành",
  cancelled: "Đã hủy",
};

export function TaskCard({ task, onEdit, onDelete }: TaskCardProps) {
  const taskId = task._id || task.id || "";

  return (
    <Card
      className="task-card"
      title={task.title}
      extra={
        <Space>
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => onEdit?.(task)}
          />
          <Popconfirm
            title="Xóa công việc"
            description="Bạn có chắc muốn xóa công việc này?"
            onConfirm={() => onDelete?.(taskId)}
            okText="Xóa"
            cancelText="Hủy"
          >
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      }
    >
      {task.description && (
        <Text type="secondary" className="task-description">
          {task.description}
        </Text>
      )}
      
      <Space className="task-tags" wrap>
        <Tag color={statusColors[task.status]}>
          {statusLabels[task.status]}
        </Tag>
        <Tag color={priorityColors[task.priority]}>
          {priorityLabels[task.priority]}
        </Tag>
      </Space>

      {task.deadline && (
        <div className="task-deadline">
          <CalendarOutlined />
          <Text type="secondary">
            {new Date(task.deadline).toLocaleDateString("vi-VN")}
          </Text>
        </div>
      )}
    </Card>
  );
}

export default TaskCard;
