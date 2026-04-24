import { Link } from "react-router-dom";
import { Button } from "antd";
import {
  ArrowRightOutlined,
  CheckCircleFilled,
  BookOutlined,
  CustomerServiceOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
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
    title: "Tạo công việc đầu tiên của bạn",
    steps: [
      {
        title: "Thêm công việc mới",
        desc: (
          <>
            Vào trang <Link to="/tasks">Công việc</Link> → nhấn{" "}
            <strong>Thêm công việc</strong> → điền tiêu đề, mô tả, deadline và
            mức ưu tiên.
          </>
        ),
      },
      {
        title: "Ước lượng thời gian",
        desc: (
          <>
            Nhập thời lượng dự kiến (ví dụ: <code>2h</code>, <code>90m</code>)
            và khoảng thời gian làm mỗi ngày (<code>30-60m</code>) để AI có dữ
            liệu lập lịch chính xác.
          </>
        ),
      },
      {
        title: "Gán tag và lưu",
        desc: (
          <>
            Thêm các tag ngăn cách bởi dấu phẩy để phân loại công việc. Nhấn{" "}
            <strong>Lưu</strong> — công việc sẽ xuất hiện ngay trong danh sách.
          </>
        ),
      },
    ],
  },
  {
    label: "BƯỚC 2 — DÙNG AI TỐI ƯU LỊCH",
    title: "Để AI phân bổ lịch làm việc tự động",
    steps: [
      {
        title: "Mở AI Tối Ưu Lịch",
        desc: (
          <>
            Trong trang <Link to="/tasks">Công việc</Link>, nhấn nút{" "}
            <span className="btn-pill">AI Tối Ưu Lịch</span> ở góc trên phải.
          </>
        ),
      },
      {
        title: "Chọn công việc cần lên lịch",
        desc: "Tick chọn các công việc bạn muốn AI sắp xếp. AI sẽ tự bỏ qua công việc đã hoàn thành hoặc đã có lịch.",
      },
      {
        title: "Xem kết quả gợi ý",
        desc: "AI đề xuất khung giờ cho từng công việc dựa trên deadline, độ ưu tiên và thời gian rảnh của bạn.",
      },
      {
        title: "Xác nhận áp dụng",
        desc: (
          <>
            Nhấn <strong>Áp dụng lịch</strong> — tất cả công việc sẽ được thêm
            vào <Link to="/calendar">Lịch</Link> ngay lập tức.
          </>
        ),
      },
    ],
    cta: { text: "Đến trang Công việc", to: "/tasks" },
  },
  {
    label: "BƯỚC 3 — AI BREAKDOWN (CHIA NHỎ CÔNG VIỆC)",
    title: "Để AI phân rã công việc lớn thành các subtask",
    steps: [
      {
        title: "Mở công việc cần phân rã",
        desc: (
          <>
            Trong <Link to="/tasks">danh sách công việc</Link>, click vào tên
            task → bảng chi tiết hiện ra với các tab{" "}
            <strong>Mô tả / Subtasks / Chat AI</strong>.
          </>
        ),
      },
      {
        title: "Nhấn nút AI Breakdown",
        desc: (
          <>
            Ở tab <strong>Subtasks</strong> hoặc góc công việc, bấm{" "}
            <span className="btn-pill">✨ AI Breakdown</span>. AI sẽ phân tích
            tiêu đề, mô tả, deadline và ước lượng của task cha để đề xuất các
            subtask hợp lý.
          </>
        ),
      },
      {
        title: "Xem và chỉnh sửa kết quả",
        desc: "AI trả về danh sách subtask kèm tiêu đề, mô tả ngắn, thời lượng ước tính và độ khó. Bạn có thể xóa bớt, đổi tên hoặc chỉnh lại thời lượng trước khi áp dụng.",
      },
      {
        title: "Áp dụng vào task cha",
        desc: (
          <>
            Nhấn <strong>Áp dụng</strong> — tất cả subtask sẽ được tạo ngay
            trong task cha. Bạn có thể tiếp tục theo dõi tiến độ từng subtask
            hoặc chạy <strong>AI Tối Ưu Lịch</strong> để sắp xếp lên Calendar.
          </>
        ),
      },
      {
        title: "Hỏi thêm AI về subtask bất kỳ",
        desc: (
          <>
            Click vào bất kỳ subtask nào → bấm <strong>Hỏi AI</strong> để chat
            riêng về cách triển khai, tài liệu liên quan hoặc rủi ro cần lưu ý.
          </>
        ),
      },
    ],
  },
  {
    label: "BƯỚC 4 — TẠO CÔNG VIỆC TRONG TEAM",
    title: "Phân công và quản lý công việc theo nhóm",
    steps: [
      {
        title: "Tạo hoặc chọn Team",
        desc: (
          <>
            Vào trang <Link to="/teams">Nhóm</Link> → nhấn{" "}
            <strong>Tạo nhóm</strong> nếu chưa có, hoặc click vào nhóm hiện hữu
            để mở bảng chi tiết.
          </>
        ),
      },
      {
        title: "Mời thành viên (kiểu Jira)",
        desc: (
          <>
            Trong bảng Team, bấm <strong>Mời thành viên</strong> → nhập{" "}
            <strong>bất kỳ email nào</strong> (không cần người đó đã có tài
            khoản) → hệ thống gửi email mời trực tiếp. Người được mời click link
            trong email để tham gia.
          </>
        ),
      },
      {
        title: "Tạo công việc nhóm",
        desc: (
          <>
            Trong trang Team, bấm <strong>+ Công việc mới</strong> → điền tiêu
            đề, mô tả, deadline, ước lượng, sau đó chọn{" "}
            <strong>Người phụ trách</strong> từ danh sách thành viên trong nhóm.
          </>
        ),
      },
      {
        title: "Theo dõi tiến độ",
        desc: (
          <>
            Task nhóm xuất hiện trong trang <Link to="/tasks">Công việc</Link>{" "}
            của người được giao và trong bảng Team. Trạng thái, comment và
            deadline được đồng bộ theo thời gian thực.
          </>
        ),
      },
      {
        title: "Chỉ lên lịch khi bạn muốn",
        desc: (
          <>
            Lưu ý: công việc nhóm <strong>không tự động</strong> được xếp vào
            Calendar. Bạn phải chủ động bấm <strong>AI Tối Ưu Lịch</strong> để
            AI phân bổ khung giờ cho từng người.
          </>
        ),
      },
    ],
    cta: { text: "Đến trang Nhóm", to: "/teams" },
  },
  {
    label: "BƯỚC 5 — TƯƠNG TÁC VỚI AI ASSISTANT",
    title: "Hỏi đáp, nhờ AI phân tích & gợi ý",
    steps: [
      {
        title: "Mở AI Chat",
        desc: (
          <>
            Bấm vào biểu tượng chat ở góc trái dưới cùng hoặc vào trang{" "}
            <Link to="/chat">Chat AI</Link>.
          </>
        ),
      },
      {
        title: "Hỏi AI về công việc cụ thể",
        desc: "Bạn có thể yêu cầu AI giải thích subtask, gợi ý cách triển khai, tóm tắt tiến độ cả nhóm hoặc phân tích tại sao lịch bị xung đột.",
      },
      {
        title: "Tham khảo gợi ý hằng ngày",
        desc: "AI thường xuyên phân tích thói quen làm việc và đưa ra gợi ý cải thiện — theo dõi trong Dashboard.",
      },
    ],
  },
];

function Guide() {
  return (
    <div className="guide-page">
      {/* Intro */}
      <section className="guide-intro">
        <span className="guide-eyebrow">
          <BookOutlined /> HƯỚNG DẪN
        </span>
        <h1 className="guide-intro-title">
          Hướng dẫn sử dụng <span className="accent">TaskMind AI</span>.
        </h1>
        <p className="guide-intro-desc">
          TaskMind AI giúp bạn quản lý công việc thông minh với sự hỗ trợ của
          AI. Đọc hướng dẫn bên dưới để làm chủ toàn bộ tính năng chỉ trong vài
          phút.
        </p>
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
                {section.cta.text} <ArrowRightOutlined />
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
            <CheckCircleFilled className="note-dot" />
            <span>
              <strong>Không chia sẻ tài khoản</strong> — thông tin công việc và
              dữ liệu cá nhân sẽ lộ ra nếu người khác đăng nhập chung.
            </span>
          </li>
          <li>
            <CheckCircleFilled className="note-dot" />
            <span>
              <strong>Đặt deadline thực tế</strong> — AI chỉ tối ưu tốt khi bạn
              cung cấp deadline và ước lượng chính xác.
            </span>
          </li>
          <li>
            <CheckCircleFilled className="note-dot" />
            <span>
              <strong>Kiểm tra lịch AI trước khi áp dụng</strong> — luôn xem bản
              xem trước để đảm bảo lịch không xung đột với kế hoạch cá nhân.
            </span>
          </li>
          <li>
            <CheckCircleFilled className="note-dot" />
            <span>
              Nếu có lỗi hoặc AI không phản hồi, dùng <strong>Chat AI</strong>{" "}
              hoặc liên hệ hỗ trợ bên dưới để được xử lý nhanh nhất.
            </span>
          </li>
        </ul>
      </section>

      {/* Support CTA */}
      <section className="guide-support">
        <h3 className="support-title">Vẫn cần hỗ trợ?</h3>
        <p className="support-desc">
          Liên hệ đội ngũ TaskMind qua chat AI hoặc xem tài liệu chi tiết để
          được xử lý nhanh nhất.
        </p>
        <div className="support-actions">
          <Link to="/chat">
            <Button type="primary" size="large" className="support-btn-primary">
              <CustomerServiceOutlined /> Mở Chat AI
            </Button>
          </Link>
          <Link to="/tasks">
            <Button size="large" className="support-btn-secondary">
              <FileTextOutlined /> Xem công việc của tôi
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer only on this guide page */}
      <div className="guide-footer-wrap">
        <Footer />
      </div>
    </div>
  );
}

export default Guide;
