import React from "react";
import { getInitial } from "./utils";

type Props = {
  name?: string;
  avatar?: string;
  size?: number;
  online?: boolean;
  className?: string;
  showDot?: boolean;
};

const MsgAvatar: React.FC<Props> = ({
  name,
  avatar,
  size = 44,
  online,
  showDot = true,
  className,
}) => {
  const style = { width: size, height: size, fontSize: size * 0.42 };
  return (
    <div className="item-avatar-wrap">
      {avatar ? (
        <img
          src={avatar}
          alt={name || ""}
          className={`item-avatar ${className || ""}`}
          style={style}
        />
      ) : (
        <div
          className={`item-avatar ${className || ""}`}
          style={style}
        >
          {getInitial(name)}
        </div>
      )}
      {showDot && online && <span className="online-dot" />}
    </div>
  );
};

export default MsgAvatar;
