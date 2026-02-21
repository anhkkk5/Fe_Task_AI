import { useState } from "react";
import { Upload, message, Avatar, Button, Spin } from "antd";
import { CameraOutlined, DeleteOutlined } from "@ant-design/icons";
import type { UploadChangeParam } from "antd/es/upload";
import type { RcFile, UploadFile, UploadProps } from "antd/es/upload/interface";
import "./ImageUpload.scss";

interface ImageUploadProps {
  value?: string;
  onChange?: (url: string) => void;
  onUpload: (file: File) => Promise<string>;
  size?: number;
  shape?: "circle" | "square";
  placeholder?: string;
  className?: string;
}

function ImageUpload({
  value,
  onChange,
  onUpload,
  size = 80,
  shape = "circle",
  placeholder = "Tải ảnh lên",
  className = "",
}: ImageUploadProps) {
  const [loading, setLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>(value || "");

  // Update preview when value prop changes
  if (value !== undefined && value !== previewUrl) {
    setPreviewUrl(value);
  }

  const beforeUpload = (file: RcFile) => {
    const isImage = file.type.startsWith("image/");
    if (!isImage) {
      message.error("Chỉ chấp nhận file ảnh!");
      return false;
    }

    const isLt5M = file.size / 1024 / 1024 < 5;
    if (!isLt5M) {
      message.error("Ảnh phải nhỏ hơn 5MB!");
      return false;
    }

    return true;
  };

  const handleChange: UploadProps["onChange"] = async (
    info: UploadChangeParam<UploadFile>,
  ) => {
    const { file } = info;

    if (file.status === "uploading") {
      setLoading(true);
      return;
    }

    if (file.status === "done" && file.originFileObj) {
      try {
        const url = await onUpload(file.originFileObj);
        setPreviewUrl(url);
        onChange?.(url);
        message.success("Tải ảnh lên thành công!");
      } catch (error: any) {
        message.error(error.message || "Tải ảnh thất bại!");
      } finally {
        setLoading(false);
      }
    }

    if (file.status === "error") {
      setLoading(false);
      message.error("Tải ảnh thất bại!");
    }
  };

  const handleDelete = () => {
    setPreviewUrl("");
    onChange?.("");
  };

  const customRequest = async ({ onSuccess, onError }: any) => {
    try {
      // This triggers the handleChange with status "done"
      onSuccess?.("ok");
    } catch (error) {
      onError?.(error);
    }
  };

  return (
    <div className={`image-upload ${className}`}>
      <Upload
        name="avatar"
        listType="picture-circle"
        className="avatar-uploader"
        showUploadList={false}
        beforeUpload={beforeUpload}
        onChange={handleChange}
        customRequest={customRequest}
        accept="image/*"
      >
        <div className="avatar-wrapper" style={{ width: size, height: size }}>
          <Avatar
            size={size}
            src={previewUrl}
            icon={!previewUrl ? <CameraOutlined /> : undefined}
            shape={shape}
            className="upload-avatar"
          />
          {loading && (
            <div
              className="loading-overlay"
              style={{ width: size, height: size }}
            >
              <Spin size="small" />
            </div>
          )}
          <div className="upload-overlay" style={{ width: size, height: size }}>
            <CameraOutlined />
          </div>
        </div>
      </Upload>

      <div className="upload-actions">
        <Upload
          beforeUpload={beforeUpload}
          onChange={handleChange}
          customRequest={customRequest}
          accept="image/*"
          showUploadList={false}
        >
          <Button icon={<CameraOutlined />} loading={loading} size="small">
            {placeholder}
          </Button>
        </Upload>

        {previewUrl && (
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={handleDelete}
            size="small"
          >
            Xóa ảnh
          </Button>
        )}
      </div>
    </div>
  );
}

export default ImageUpload;
