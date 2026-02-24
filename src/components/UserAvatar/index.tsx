import { Avatar } from "antd";
import { UserOutlined } from "@ant-design/icons";

interface UserAvatarProps {
  src?: string;
  name?: string;
  size?: number;
  className?: string;
}

export function UserAvatar({ src, name, size = 32, className = "" }: UserAvatarProps) {
  return (
    <Avatar
      src={src}
      size={size}
      icon={<UserOutlined />}
      className={className}
      alt={name || "User"}
    />
  );
}

export default UserAvatar;
