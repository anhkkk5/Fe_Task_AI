import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { Button, message, Progress, Modal, Input } from "antd";
import { triggerOnboardingTour } from "../../components/OnboardingTour";
import { showOnboardingMissions } from "../../components/OnboardingMissions";
import {
  getGuideVideo,
  uploadGuideVideo,
  updateGuideVideoEmbed,
} from "../../services/adminServices";
import Footer from "../../layouts/LayoutDefault/Footer";
import "./Guide.scss";

type Step = {
  title: string;
  desc: React.ReactNode;
};

type Section = {
  label: string;
  title: string;
  steps: Step[];
  cta?: { text: string; to: string };
};

const sections: Section[] = [
  {
    label: "BƯỚC 1 — BẮT ĐẦU VỚI TASKMIND",
    title: "Tạo & Quản lý công việc thông minh",
    steps: [
      {
        title: "Thêm công việc mới",
        desc: (
          <>
            Vào trang <Link to="/tasks">Công việc</Link> → nhấn{" "}
            <strong>+ Thêm công việc</strong> → điền tiêu đề, mô tả, mức ưu tiên
            (Thấp / Trung bình / Cao), ngày bắt đầu và hạn chót (Deadline).
          </>
        ),
      },
      {
        title: "Ước lượng thời gian & Mục tiêu ngày",
        desc: (
          <>
            Nhập thời lượng dự kiến (ví dụ: <code>90m</code>, <code>2h</code>) và
            khoảng thời gian làm việc mục tiêu mỗi ngày (ví dụ: <code>30-60 phút</code>)
            để thuật toán AI có dữ liệu lập lịch chính xác nhất.
          </>
        ),
      },
      {
        title: "Tự động nhận diện Quá hạn & Gia hạn linh hoạt",
        desc: (
          <>
            Nếu công việc đến hạn chót mà chưa hoàn thành, hệ thống sẽ tự động gán nhãn đỏ{" "}
            <strong style={{ color: "#dc2626" }}>Quá hạn ⏱</strong>. Bạn có thể bấm vào nhãn này hoặc chọn menu <code>...</code> →{" "}
            <strong>Gia hạn hạn chót</strong> để cập nhật thời gian mới.
          </>
        ),
      },
      {
        title: "Chế độ xem Danh sách & Kanban",
        desc: (
          <>
            Bạn có thể dễ dàng chuyển đổi qua lại giữa <strong>Dạng danh sách</strong> (bảng chi tiết) và{" "}
            <strong>Bảng Kanban</strong> để kéo thả thay đổi trạng thái công việc nhanh chóng.
          </>
        ),
      },
    ],
    cta: { text: "Đến trang Công việc", to: "/tasks" },
  },
  {
    label: "BƯỚC 2 — DÙNG AI TỐI ƯU LỊCH",
    title: "Để AI phân bổ lịch làm việc tự động vào Calendar",
    steps: [
      {
        title: "Mở AI Tối Ưu Lịch",
        desc: (
          <>
            Trong trang <Link to="/tasks">Công việc</Link> hoặc <Link to="/calendar">Lịch</Link>, nhấn nút gradient{" "}
            <span className="btn-pill">AI Tối Ưu Lịch</span> ở góc trên bên phải thanh công cụ.
          </>
        ),
      },
      {
        title: "Chọn danh sách công việc & Khoảng thời gian",
        desc: (
          <>
            Đánh dấu chọn các công việc bạn muốn xếp lịch, thiết lập thời gian bắt đầu và kết thúc mà bạn muốn AI phân bổ. AI sẽ tự động tính toán dựa trên mức ưu tiên, hạn chót và thời gian ước tính.
          </>
        ),
      },
      {
        title: "Quy tắc chèn công việc thông minh",
        desc: (
          <>
            Hệ thống hỗ trợ thuộc tính <strong>Cho phép chèn</strong> (AI có thể linh hoạt xếp việc đè vào khung giờ làm việc/tự học) và <strong>Không cho phép chèn</strong> (khung giờ cố định như họp quan trọng, nghỉ ngơi sẽ không bao giờ bị đè lên).
          </>
        ),
      },
      {
        title: "Xác nhận & Áp dụng lịch",
        desc: (
          <>
            Nhấn <strong>Áp dụng lịch</strong> — toàn bộ công việc được xếp sẽ tự động xuất hiện trên{" "}
            <Link to="/calendar">Lịch biểu</Link> và chuyển trạng thái thành <strong>Đã lên lịch</strong>.
          </>
        ),
      },
    ],
    cta: { text: "Xem trang Lịch", to: "/calendar" },
  },
  {
    label: "BƯỚC 3 — AI BREAKDOWN & AI COPILOT",
    title: "Chia nhỏ việc phức tạp & Trợ lý hỏi đáp chuyên sâu",
    steps: [
      {
        title: "Phân rã việc tự động (AI Breakdown)",
        desc: (
          <>
            Ở bất kỳ công việc nào, bấm biểu tượng <strong>AI Breakdown</strong>. AI sẽ phân tích nội dung task cha và chia nhỏ thành các bước việc cụ thể (subtask) kèm thời lượng ước tính và độ khó (Dễ / Trung bình / Khó).
          </>
        ),
      },
      {
        title: "Hỏi AI về từng bước việc",
        desc: (
          <>
            Khi xem danh sách bước việc con (subtask), nhấp vào tên bất kỳ bước nào, hệ thống sẽ tự động chuyển sang trang <Link to="/chat">Chat AI</Link> và điền sẵn câu hỏi hướng dẫn chi tiết cách triển khai bước đó.
          </>
        ),
      },
      {
        title: "Trợ lý AI Copilot trong Chi tiết Task",
        desc: (
          <>
            Click vào dòng công việc để mở modal chi tiết → chọn tab <strong>🤖 Trợ lý AI Copilot</strong> để trò chuyện trực tiếp với AI, nhờ AI gợi ý lộ trình, tài liệu tham khảo hoặc giải quyết vướng mắc riêng cho công việc đó.
          </>
        ),
      },
    ],
  },
  {
    label: "BƯỚC 4 — LÀM VIỆC NHÓM & PHÂN CÔNG (TEAMS)",
    title: "Quản lý dự án nhóm, phân quyền & gia hạn hạn chót",
    steps: [
      {
        title: "Tạo nhóm làm việc tinh gọn",
        desc: (
          <>
            Vào trang <Link to="/teams">Nhóm</Link> → nhấn <strong>+ Tạo nhóm</strong> chỉ với 2 thông tin: Tên nhóm và Mô tả.
          </>
        ),
      },
      {
        title: "Mời thành viên qua Email",
        desc: (
          <>
            Trong bảng Nhóm, nhấn <strong>Mời thành viên</strong> → nhập địa chỉ email của thành viên. Hệ thống Brevo sẽ tự động gửi thư mời kèm link tham gia trực tiếp.
          </>
        ),
      },
      {
        title: "Tạo và giao việc trong nhóm",
        desc: (
          <>
            Tạo công việc nhóm và chọn <strong>Người phụ trách</strong> từ danh sách thành viên. Công việc sẽ tự động xuất hiện trong danh sách cá nhân của người được giao với nhãn <strong>Quản lý ở Team</strong>.
          </>
        ),
      },
      {
        title: "Quy trình gia hạn hạn chót theo vai trò",
        desc: (
          <>
            • <strong>Thành viên</strong>: Nếu quá hạn, bấm <em>Yêu cầu gia hạn</em> và nhập lý do. Hệ thống sẽ gửi thông báo đến Trưởng nhóm/Chủ dự án.<br />
            • <strong>Trưởng nhóm / Chủ dự án</strong>: Có quyền tự gia hạn trực tiếp bất kỳ lúc nào, hoặc xét duyệt yêu cầu của thành viên bằng 2 nút <em>Phê duyệt</em> hoặc <em>Từ chối</em>.
          </>
        ),
      },
    ],
    cta: { text: "Đến trang Nhóm", to: "/teams" },
  },
  {
    label: "BƯỚC 5 — TRỢ LÝ CHAT AI TOÀN NĂNG",
    title: "Trò chuyện, tư vấn năng suất & lên lịch qua hội thoại",
    steps: [
      {
        title: "Truy cập Chat AI",
        desc: (
          <>
            Bấm vào mục <Link to="/chat">Chat AI</Link> trên thanh Menu bên trái để mở giao diện hội thoại toàn màn hình hiện đại.
          </>
        ),
      },
      {
        title: "Lên lịch theo hướng dẫn (AI Scheduling Guide)",
        desc: (
          <>
            Sử dụng các mẫu có sẵn: <em>Bắt đầu từng bước</em> (AI hỏi từng tiêu chí), <em>Mẫu nhập nhanh</em>, hoặc <em>Kiểm tra lịch rảnh trước</em> để AI gợi ý thời gian phù hợp nhất.
          </>
        ),
      },
      {
        title: "Chốt lịch trực tiếp từ tin nhắn",
        desc: (
          <>
            Khi AI phản hồi đề xuất kế hoạch, một thẻ hành động sẽ xuất hiện kèm nút <strong>Lên lịch ngay</strong> để bạn thêm trực tiếp vào Lịch mà không cần nhập lại dữ liệu.
          </>
        ),
      },
      {
        title: "Lưu trữ lịch sử hội thoại",
        desc: (
          <>
            Toàn bộ các cuộc trò chuyện được tự động lưu lại ở thanh bên trái theo từng ngày, cho phép bạn xem lại hoặc tạo đoạn chat mới bất kỳ lúc nào.
          </>
        ),
      },
    ],
    cta: { text: "Mở Chat AI", to: "/chat" },
  },
  {
    label: "BƯỚC 6 — CẤU HÌNH THÓI QUEN LÀM VIỆC (AI HABITS)",
    title: "Cá nhân hóa nhịp sinh học và tối ưu hiệu suất",
    steps: [
      {
        title: "Mở Hồ sơ cá nhân",
        desc: (
          <>
            Click vào Avatar của bạn ở góc trái dưới cùng của thanh Menu → vào trang <Link to="/profile">Hồ sơ cá nhân</Link>.
          </>
        ),
      },
      {
        title: "Thiết lập Thói quen làm việc (User Habits)",
        desc: (
          <>
            Tùy chỉnh: Khung giờ làm việc hiệu quả nhất (Buổi sáng / Buổi chiều / Buổi tối / Linh hoạt), thời gian tập trung tối đa, thời gian nghỉ ngơi giữa các session làm việc.
          </>
        ),
      },
      {
        title: "Tối ưu hóa thuật toán AI",
        desc: (
          <>
            Khi bạn bấm <strong>Lưu thói quen</strong>, các công cụ AI Tối Ưu Lịch và Chat AI sẽ tự động đọc cấu hình này để phân bổ công việc đúng vào các khoảng thời gian bạn sung sức nhất.
          </>
        ),
      },
    ],
    cta: { text: "Xem Hồ sơ cá nhân", to: "/profile" },
  },
];

function Guide() {
  const { user } = useSelector((state: any) => state.auth);
  const isAdmin = user?.role === "admin";

  const [videoUrl, setVideoUrl] = useState<string>("/videos/guide-tasks.mp4");
  const [videoType, setVideoType] = useState<string>("video");
  const [isEmbedModalOpen, setIsEmbedModalOpen] = useState<boolean>(false);
  const [embedInput, setEmbedInput] = useState<string>("");
  const [savingEmbed, setSavingEmbed] = useState<boolean>(false);
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadPercent, setUploadPercent] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let mounted = true;
    getGuideVideo()
      .then((res) => {
        if (mounted && res?.videoUrl) {
          setVideoUrl(res.videoUrl);
          const isYt =
            res.videoType === "youtube" ||
            res.videoUrl.includes("youtube.com") ||
            res.videoUrl.includes("youtu.be");
          setVideoType(isYt ? "youtube" : "video");
          if (res.rawEmbed) {
            setEmbedInput(res.rawEmbed);
          }
        }
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  const handleSaveEmbed = async () => {
    const trimmed = embedInput.trim();
    if (!trimmed) {
      message.warning("Vui lòng dán đoạn mã nhúng <iframe> hoặc liên kết video YouTube");
      return;
    }

    setSavingEmbed(true);
    try {
      const res = await updateGuideVideoEmbed(trimmed);
      if (res?.videoUrl) {
        setVideoUrl(res.videoUrl);
        setVideoType("youtube");
        message.success("Đã nhúng video YouTube thành công!");
        setIsEmbedModalOpen(false);
      }
    } catch (err: any) {
      message.error(err?.response?.data?.message || err?.message || "Nhúng video thất bại");
    } finally {
      setSavingEmbed(false);
    }
  };

  const handleAdminVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("video/")) {
      message.error("Vui lòng chọn file định dạng video (MP4, WebM,...)");
      return;
    }

    // Cho phép upload video dung lượng lớn lên đến 2GB
    if (file.size > 2 * 1024 * 1024 * 1024) {
      message.error("Kích thước video không được vượt quá 2GB");
      return;
    }

    setUploading(true);
    setUploadPercent(0);
    const hideLoading = message.loading("Đang khởi tạo tải video lên Cloudinary...", 0);
    try {
      const res = await uploadGuideVideo(file, (percent) => {
        setUploadPercent(percent);
      });
      if (res?.videoUrl) {
        setVideoUrl(res.videoUrl);
        setVideoType("video");
        message.success("Đã tải lên và lưu video hướng dẫn lên Cloudinary thành công!");
      } else {
        message.success("Tải lên video thành công!");
      }
    } catch (err: any) {
      message.error(err?.response?.data?.message || err?.message || "Tải video lên thất bại");
    } finally {
      hideLoading();
      setUploading(false);
      setUploadPercent(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="guide-page">
      {/* Intro */}
      <section className="guide-intro">
        <span className="guide-eyebrow">
          HƯỚNG DẪN SỬ DỤNG
        </span>
        <h1 className="guide-intro-title">
          Làm chủ toàn diện <span className="accent">TaskMind AI</span>.
        </h1>
        <p className="guide-intro-desc">
          TaskMind AI kết hợp quản lý công việc, lịch biểu thông minh và AI Assistant để tối ưu hóa năng suất của bạn và đội ngũ. Dưới đây là quy trình chuẩn giúp bạn sử dụng thành thạo chỉ sau 2 phút.
        </p>
        <div style={{ marginTop: 24, display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
          <Button
            type="primary"
            size="large"
            onClick={() => triggerOnboardingTour()}
            style={{
              height: 46,
              padding: "0 22px",
              borderRadius: 12,
              fontWeight: 600,
              fontSize: 14.5,
              background: "linear-gradient(135deg, #1aa0b0 0%, #148f9f 100%)",
              boxShadow: "0 8px 20px -4px rgba(26, 160, 176, 0.35)",
              border: "none",
            }}
          >
            Tour hướng dẫn tương tác (Step-by-Step)
          </Button>

          <Button
            size="large"
            onClick={() => showOnboardingMissions()}
            style={{
              height: 46,
              padding: "0 22px",
              borderRadius: 12,
              fontWeight: 600,
              fontSize: 14.5,
              background: "#e8f4f6",
              borderColor: "#bfe5ea",
              color: "#0f7985",
            }}
          >
            Nhiệm vụ nhập môn thực hành (0/3)
          </Button>
        </div>
      </section>

      {/* Video Guide Section - 1 ô video duy nhất, chỉ có admin mới hiện upload lên Cloudinary */}
      <section className="guide-section guide-videos-section">
        <div className="guide-video-header">
          <h2 className="guide-section-title" style={{ margin: 0 }}>
            Video hướng dẫn
          </h2>

          {isAdmin && (
            <div className="admin-video-actions">
              <input
                type="file"
                ref={fileInputRef}
                accept="video/mp4,video/webm,video/ogg,video/quicktime"
                style={{ display: "none" }}
                onChange={handleAdminVideoUpload}
              />
              <Button
                type="primary"
                onClick={() => setIsEmbedModalOpen(true)}
                className="admin-embed-video-btn"
                style={{
                  height: 40,
                  borderRadius: 10,
                  fontWeight: 600,
                  fontSize: 13.5,
                  background: "linear-gradient(135deg, #1aa0b0 0%, #148f9f 100%)",
                  border: "none",
                  boxShadow: "0 4px 12px rgba(26, 160, 176, 0.3)",
                }}
              >
                Nhúng video YouTube
              </Button>
              <Button
                loading={uploading}
                disabled={uploading}
                onClick={() => fileInputRef.current?.click()}
                className="admin-upload-video-btn"
              >
                {uploading ? `Đang tải: ${uploadPercent}%` : "Tải từ máy"}
              </Button>
            </div>
          )}
        </div>

        {uploading && (
          <div
            style={{
              marginBottom: 16,
              padding: "14px 18px",
              background: "#e8f4f6",
              borderRadius: 12,
              border: "1px solid #bfe5ea",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 6,
                fontSize: 13.5,
                fontWeight: 600,
                color: "#0f7985",
              }}
            >
              <span>Đang tải video lên Cloudinary (hỗ trợ &gt; 500MB đến 2GB)...</span>
              <span>{uploadPercent}%</span>
            </div>
            <Progress
              percent={uploadPercent}
              status="active"
              strokeColor={{ "0%": "#1aa0b0", "100%": "#0f7985" }}
            />
            <div style={{ fontSize: 12, color: "#54767b", marginTop: 4 }}>
              * Lưu ý: Đối với video dung lượng lớn (&gt; 500MB), quá trình tải lên và xử lý video trên Cloudinary có thể mất vài phút. Vui lòng giữ nguyên cửa sổ này.
            </div>
          </div>
        )}

        <div className="single-video-container">
          <div className="single-video-wrapper">
            {videoType === "youtube" || videoUrl.includes("youtube.com") || videoUrl.includes("youtu.be") ? (
              <iframe
                key={videoUrl}
                src={videoUrl}
                title="Video hướng dẫn TaskMind"
                className="single-video-player"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
                style={{ border: 0, width: "100%", height: "100%" }}
              />
            ) : (
              <video
                key={videoUrl}
                src={videoUrl}
                controls
                playsInline
                preload="metadata"
                className="single-video-player"
              >
                Trình duyệt của bạn không hỗ trợ thẻ video HTML5.
              </video>
            )}
          </div>
        </div>
      </section>

      {/* Steps sections */}
      {sections.map((section, idx) => (
        <section key={idx} className="guide-section">
          <span className="guide-section-label">{section.label}</span>
          <h2 className="guide-section-title">{section.title}</h2>

          <ol className="guide-step-list">
            {section.steps.map((step, stepIdx) => (
              <li key={stepIdx} className="guide-step-item">
                <span className="step-number">{stepIdx + 1}</span>
                <div className="step-body">
                  <h3 className="step-title">{step.title}</h3>
                  <p className="step-desc">{step.desc}</p>
                </div>
              </li>
            ))}
          </ol>

          {section.cta && (
            <Link to={section.cta.to} className="guide-section-cta">
              <Button type="primary" size="large" className="guide-cta-btn">
                {section.cta.text}
              </Button>
            </Link>
          )}
        </section>
      ))}

      {/* Important notes */}
      <section className="guide-section guide-notes">
        <span className="guide-section-label warning-label">
          LƯU Ý QUAN TRỌNG
        </span>
        <ul className="guide-note-list">
          <li>
            <span className="note-bullet" />
            <span>
              <strong>Bảo mật thông tin</strong> — Tuyệt đối không chia sẻ mật khẩu tài khoản để đảm bảo an toàn cho dữ liệu công việc và tài liệu dự án của nhóm.
            </span>
          </li>
          <li>
            <span className="note-bullet" />
            <span>
              <strong>Ước lượng deadline & thời lượng thực tế</strong> — Thuật toán AI lập lịch chính xác nhất khi bạn cung cấp deadline và thời lượng ước tính sát với thực tế.
            </span>
          </li>
          <li>
            <span className="note-bullet" />
            <span>
              <strong>Xem trước lịch trước khi áp dụng</strong> — Khi dùng <strong>AI Tối Ưu Lịch</strong>, hãy kiểm tra danh sách gợi ý trước khi bấm áp dụng để chủ động kiểm soát thời gian biểu.
            </span>
          </li>
          <li>
            <span className="note-bullet" />
            <span>
              <strong>Gia hạn linh hoạt</strong> — Khi không kịp hoàn thành, hãy sử dụng tính năng <em>Gia hạn hạn chót</em> (đối với việc cá nhân) hoặc <em>Yêu cầu gia hạn</em> (đối với việc nhóm) để tránh task bị quá hạn.
            </span>
          </li>
        </ul>
      </section>

      {/* Support CTA */}
      <section className="guide-support">
        <h3 className="support-title">Cần trợ giúp ngay lập tức?</h3>
        <p className="support-desc">
          Mở trợ lý Chat AI để được tư vấn cách lên lịch hoặc xem danh sách công việc hiện tại của bạn.
        </p>
        <div className="support-actions">
          <Link to="/chat">
            <Button type="primary" size="large" className="support-btn-primary">
              Mở Chat AI
            </Button>
          </Link>
          <Link to="/tasks">
            <Button size="large" className="support-btn-secondary">
              Xem công việc của tôi
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <div className="guide-footer-wrap">
        <Footer />
      </div>

      {/* Modal Nhúng YouTube dành riêng cho Quản trị viên */}
      <Modal
        title="Nhúng video hướng dẫn từ YouTube"
        open={isEmbedModalOpen}
        onOk={handleSaveEmbed}
        onCancel={() => setIsEmbedModalOpen(false)}
        confirmLoading={savingEmbed}
        okText="Lưu video nhúng"
        cancelText="Hủy"
        okButtonProps={{
          style: {
            background: "linear-gradient(135deg, #1aa0b0 0%, #148f9f 100%)",
            border: "none",
          },
        }}
      >
        <p style={{ color: "#64748b", fontSize: 13.5, marginBottom: 12, lineHeight: 1.5 }}>
          Dán đoạn mã nhúng <code>&lt;iframe&gt;</code> từ YouTube hoặc đường link video (ví dụ: <code>https://youtu.be/...</code> hoặc <code>https://www.youtube.com/watch?v=...</code>). Hệ thống sẽ tự động nhận diện và nhúng vào trang.
        </p>
        <Input.TextArea
          rows={5}
          value={embedInput}
          onChange={(e) => setEmbedInput(e.target.value)}
          placeholder='<iframe width="560" height="315" src="https://www.youtube.com/embed/OscbUfRd75I" title="YouTube video player" frameborder="0" allowfullscreen></iframe>'
          style={{ borderRadius: 8, fontSize: 13 }}
        />
      </Modal>
    </div>
  );
}

export default Guide;
