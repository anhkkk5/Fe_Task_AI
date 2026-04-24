import { Link } from "react-router-dom";

function Footer() {
  return (
    <footer className="app-footer">
      <div className="app-footer-inner">
        {/* Brand column */}
        <div className="footer-col footer-brand-col">
          <div className="footer-brand">
            <span className="footer-brand-logo">
              <span>T</span>
            </span>
            <span className="footer-brand-name">TASKMIND AI</span>
          </div>
          <p className="footer-brand-desc">
            Nền tảng quản lý công việc thông minh với AI — tự động lên lịch, tối
            ưu năng suất và hỗ trợ mọi bước làm việc của bạn.
          </p>
        </div>

        {/* Navigation column */}
        <div className="footer-col">
          <h4 className="footer-col-title">ĐIỀU HƯỚNG</h4>
          <ul className="footer-link-list">
            <li>
              <Link to="/tasks">Công việc</Link>
            </li>
            <li>
              <Link to="/calendar">Lịch</Link>
            </li>
            <li>
              <Link to="/teams">Nhóm</Link>
            </li>
            <li>
              <Link to="/chat">Chat AI</Link>
            </li>
            <li>
              <Link to="/guide">Hướng dẫn</Link>
            </li>
          </ul>
        </div>

        {/* Contact column */}
        <div className="footer-col">
          <h4 className="footer-col-title">LIÊN HỆ</h4>
          <ul className="footer-link-list">
            <li>
              Email:{" "}
              <a href="mailto:support@taskmind.ai">support@taskmind.ai</a>
            </li>
            <li>
              Zalo: <a href="tel:0862500016">0862 500 016</a>
            </li>
          </ul>
          <p className="footer-copyright">
            © 2026 TaskMind AI. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
