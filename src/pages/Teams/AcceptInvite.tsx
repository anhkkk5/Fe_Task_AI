import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card, Button, Spin, Result, Tag, message } from "antd";
import {
  TeamOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";
import {
  getInviteInfo,
  acceptInvite,
  declineInvite,
} from "../../services/teamServices";

export default function AcceptInvite() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");
  const [info, setInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState<"accepted" | "declined" | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setError("Token không hợp lệ");
      setLoading(false);
      return;
    }
    getInviteInfo(token)
      .then(setInfo)
      .catch((err) =>
        setError(
          err?.response?.data?.message ||
            "Lời mời không hợp lệ hoặc đã hết hạn",
        ),
      )
      .finally(() => setLoading(false));
  }, [token]);

  const handleAccept = async () => {
    try {
      setProcessing(true);
      const res = await acceptInvite(token!);
      setDone("accepted");
      setTimeout(() => navigate(`/teams/${res.teamId}`), 1500);
    } catch (err: any) {
      message.error(err?.response?.data?.message || "Không thể tham gia nhóm");
    } finally {
      setProcessing(false);
    }
  };

  const handleDecline = async () => {
    try {
      setProcessing(true);
      await declineInvite(token!);
      setDone("declined");
    } catch {
      message.error("Có lỗi xảy ra");
    } finally {
      setProcessing(false);
    }
  };

  if (loading)
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: 80 }}>
        <Spin size="large" />
      </div>
    );

  if (error)
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: 80 }}>
        <Result
          status="error"
          title="Lời mời không hợp lệ"
          subTitle={error}
          extra={
            <Button onClick={() => navigate("/teams")}>Về trang nhóm</Button>
          }
        />
      </div>
    );

  if (done === "accepted")
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: 80 }}>
        <Result
          status="success"
          title="Đã tham gia nhóm!"
          subTitle="Đang chuyển hướng..."
        />
      </div>
    );

  if (done === "declined")
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: 80 }}>
        <Result
          title="Đã từ chối lời mời"
          extra={<Button onClick={() => navigate("/")}>Về trang chủ</Button>}
        />
      </div>
    );

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        background: "var(--background-tertiary)",
      }}
    >
      <Card
        style={{
          maxWidth: 480,
          width: "100%",
          borderRadius: 12,
          textAlign: "center",
        }}
      >
        <div style={{ marginBottom: 24 }}>
          <div
            style={{
              width: 64,
              height: 64,
              background: "var(--color-very-light-blue)",
              borderRadius: 16,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
              fontSize: 28,
              color: "var(--color-primary-blue)",
            }}
          >
            <TeamOutlined />
          </div>
          <h2 style={{ margin: "0 0 8px", color: "var(--color-text-primary)" }}>
            Lời mời tham gia nhóm
          </h2>
          <p style={{ color: "var(--color-text-secondary)", margin: 0 }}>
            <strong>{info.inviterName}</strong> mời bạn tham gia nhóm
          </p>
        </div>

        <div
          style={{
            background: "var(--color-light-gray)",
            borderRadius: 8,
            padding: "16px 20px",
            marginBottom: 24,
            textAlign: "left",
          }}
        >
          <div
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: "var(--color-text-primary)",
              marginBottom: 8,
            }}
          >
            {info.teamName}
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span
              style={{ color: "var(--color-text-secondary)", fontSize: 13 }}
            >
              Vai trò:
            </span>
            <Tag color="blue">{info.role}</Tag>
          </div>
        </div>

        <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
          <Button
            size="large"
            icon={<CloseCircleOutlined />}
            onClick={handleDecline}
            loading={processing}
            style={{ minWidth: 120 }}
          >
            Từ chối
          </Button>
          <Button
            type="primary"
            size="large"
            icon={<CheckCircleOutlined />}
            onClick={handleAccept}
            loading={processing}
            style={{ minWidth: 120 }}
          >
            Tham gia
          </Button>
        </div>
      </Card>
    </div>
  );
}
