import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Button,
  Modal,
  Form,
  Input,
  Spin,
  message,
  Input as AntInput,
} from "antd";
import {
  PlusOutlined,
  SearchOutlined,
  TeamOutlined,
  UserOutlined,
  AppstoreOutlined,
} from "@ant-design/icons";
import {
  listTeams,
  createTeam,
  type Team,
  type TeamMember,
} from "../../services/teamServices";
import "./Teams.scss";

// Generate consistent color from string
const getAvatarColor = (str: string) => {
  const colors = [
    "#0052CC",
    "#00875A",
    "#FF5630",
    "#FF8B00",
    "#6554C0",
    "#00B8D9",
    "#36B37E",
    "#FF7452",
  ];
  let hash = 0;
  for (let i = 0; i < str.length; i++)
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
};

const MemberAvatar = ({
  member,
  size = 40,
}: {
  member: TeamMember;
  size?: number;
}) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: "50%",
      background: member.avatar ? undefined : getAvatarColor(member.name),
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: size * 0.38,
      fontWeight: 700,
      color: "white",
      overflow: "hidden",
      flexShrink: 0,
    }}
  >
    {member.avatar ? (
      <img
        src={member.avatar}
        alt={member.name}
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />
    ) : (
      member.name.slice(0, 2).toUpperCase()
    )}
  </div>
);

type ActiveTab = "for-you" | "teams" | "people";

export default function TeamsPage() {
  const navigate = useNavigate();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [creating, setCreating] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>("for-you");
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadTeams();
  }, []);

  const loadTeams = async () => {
    try {
      setLoading(true);
      const data = await listTeams();
      setTeams(data);
    } catch {
      message.error("Không thể tải danh sách nhóm");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (values: {
    name: string;
    description?: string;
  }) => {
    try {
      setCreating(true);
      const team = await createTeam(values);
      message.success("Tạo nhóm thành công!");
      setModalOpen(false);
      form.resetFields();
      navigate(`/teams/${team.id}`);
    } catch {
      message.error("Không thể tạo nhóm");
    } finally {
      setCreating(false);
    }
  };

  // All unique members across all teams
  const allMembers = Array.from(
    new Map(teams.flatMap((t) => t.members).map((m) => [m.userId, m])).values(),
  );

  const filteredTeams = teams.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase()),
  );
  const filteredMembers = allMembers.filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.email.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="jira-teams-page">
      {/* Left Sidebar */}
      <aside className="jira-teams-sidebar">
        <nav>
          <button
            className={`jira-nav-item ${activeTab === "for-you" ? "active" : ""}`}
            onClick={() => setActiveTab("for-you")}
          >
            <AppstoreOutlined />
            <span>Dành cho bạn</span>
          </button>
          <button
            className={`jira-nav-item ${activeTab === "teams" ? "active" : ""}`}
            onClick={() => setActiveTab("teams")}
          >
            <TeamOutlined />
            <span>Nhóm</span>
          </button>
          <button
            className={`jira-nav-item ${activeTab === "people" ? "active" : ""}`}
            onClick={() => setActiveTab("people")}
          >
            <UserOutlined />
            <span>Mọi người</span>
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="jira-teams-content">
        {/* Top bar */}
        <div className="jira-teams-topbar">
          <AntInput
            prefix={
              <SearchOutlined style={{ color: "var(--color-text-tertiary)" }} />
            }
            placeholder="Tìm kiếm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="jira-search-input"
          />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setModalOpen(true)}
          >
            Tạo
          </Button>
        </div>

        {loading ? (
          <div className="jira-loading">
            <Spin size="large" />
          </div>
        ) : (
          <div className="jira-teams-body">
            {/* FOR YOU tab */}
            {activeTab === "for-you" && (
              <>
                {/* Members section */}
                <section className="jira-section">
                  <div className="jira-section-header">
                    <h3>Những người bạn làm việc cùng</h3>
                    <button
                      className="jira-link"
                      onClick={() => setActiveTab("people")}
                    >
                      Duyệt xem tất cả mọi người →
                    </button>
                  </div>
                  {allMembers.length === 0 ? (
                    <p className="jira-empty-text">Chưa có thành viên nào</p>
                  ) : (
                    <div className="jira-people-grid">
                      {allMembers.slice(0, 6).map((m) => (
                        <div key={m.userId} className="jira-person-card">
                          <MemberAvatar member={m} size={72} />
                          <div className="jira-person-name">{m.name}</div>
                          <div className="jira-person-email">{m.email}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                {/* Teams section */}
                <section className="jira-section">
                  <div className="jira-section-header">
                    <h3>Nhóm của bạn</h3>
                    <button
                      className="jira-link"
                      onClick={() => setActiveTab("teams")}
                    >
                      Duyệt tất cả đội ngũ →
                    </button>
                  </div>
                  {teams.length === 0 ? (
                    <div className="jira-empty-teams">
                      <p>Bạn chưa có nhóm nào.</p>
                      <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => setModalOpen(true)}
                      >
                        Tạo nhóm đầu tiên
                      </Button>
                    </div>
                  ) : (
                    <div className="jira-teams-list">
                      {teams.slice(0, 4).map((team) => (
                        <div
                          key={team.id}
                          className="jira-team-row"
                          onClick={() => navigate(`/teams/${team.id}`)}
                        >
                          <div className="jira-team-icon">
                            <TeamOutlined />
                          </div>
                          <div className="jira-team-row-info">
                            <div className="jira-team-row-name">
                              {team.name}
                            </div>
                            <div className="jira-team-row-meta">
                              {team.description && (
                                <span>{team.description} • </span>
                              )}
                              <span>{team.members.length} thành viên</span>
                            </div>
                          </div>
                          <div className="jira-team-avatars">
                            {team.members.slice(0, 5).map((m) => (
                              <MemberAvatar
                                key={m.userId}
                                member={m}
                                size={28}
                              />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </>
            )}

            {/* TEAMS tab */}
            {activeTab === "teams" && (
              <section className="jira-section">
                <div className="jira-section-header">
                  <h3>Nhóm</h3>
                  <Button
                    icon={<PlusOutlined />}
                    onClick={() => setModalOpen(true)}
                  >
                    Tạo đội ngũ
                  </Button>
                </div>
                {filteredTeams.length === 0 ? (
                  <p className="jira-empty-text">Không tìm thấy nhóm nào</p>
                ) : (
                  <div className="jira-teams-list">
                    {filteredTeams.map((team) => (
                      <div
                        key={team.id}
                        className="jira-team-row"
                        onClick={() => navigate(`/teams/${team.id}`)}
                      >
                        <div className="jira-team-icon">
                          <TeamOutlined />
                        </div>
                        <div className="jira-team-row-info">
                          <div className="jira-team-row-name">{team.name}</div>
                          <div className="jira-team-row-meta">
                            {team.description && (
                              <span>{team.description} • </span>
                            )}
                            <span>{team.members.length} thành viên</span>
                          </div>
                        </div>
                        <div className="jira-team-avatars">
                          {team.members.slice(0, 5).map((m) => (
                            <MemberAvatar key={m.userId} member={m} size={28} />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}

            {/* PEOPLE tab */}
            {activeTab === "people" && (
              <section className="jira-section">
                <div className="jira-section-header">
                  <h3>Mọi người</h3>
                  <span className="jira-count">
                    {filteredMembers.length} người
                  </span>
                </div>
                {filteredMembers.length === 0 ? (
                  <p className="jira-empty-text">Không tìm thấy ai</p>
                ) : (
                  <div className="jira-people-grid large">
                    {filteredMembers.map((m) => (
                      <div key={m.userId} className="jira-person-card large">
                        <MemberAvatar member={m} size={80} />
                        <div className="jira-person-name">{m.name}</div>
                        <div className="jira-person-email">{m.email}</div>
                        <div className="jira-person-role">{m.role}</div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}
          </div>
        )}
      </div>

      {/* Create Team Modal */}
      <Modal
        title="Tạo nhóm mới"
        open={modalOpen}
        onCancel={() => {
          setModalOpen(false);
          form.resetFields();
        }}
        footer={null}
        width={480}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreate}
          style={{ marginTop: 16 }}
        >
          <Form.Item
            name="name"
            label="Tên nhóm"
            rules={[
              { required: true, message: "Vui lòng nhập tên nhóm" },
              { min: 2, message: "Tên nhóm tối thiểu 2 ký tự" },
            ]}
          >
            <Input placeholder="VD: Frontend Team, Marketing..." />
          </Form.Item>
          <Form.Item name="description" label="Mô tả (tuỳ chọn)">
            <Input.TextArea rows={3} placeholder="Mô tả ngắn về nhóm..." />
          </Form.Item>
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <Button
              onClick={() => {
                setModalOpen(false);
                form.resetFields();
              }}
            >
              Huỷ
            </Button>
            <Button type="primary" htmlType="submit" loading={creating}>
              Tạo nhóm
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
