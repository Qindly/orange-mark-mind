import { Navbar, Footer } from '@/layouts';
import './Home.scss';

function Home() {
  return (
    <div className="home-page">
      <Navbar />

      {/* Hero 区域 */}
      <section className="hero">
        <div className="container hero__content">
          <div className="hero__text">
            <h1 className="hero__title">
              文档协同
              <br />
              知识管理
            </h1>
            <p className="hero__subtitle">
              为每一个人，为每一个团队，提供优秀的文档与知识库工具
            </p>
            <div className="hero__actions">
              <a href="/register" className="btn btn-primary btn-large">
                免费开始使用
              </a>
              <a href="#features" className="btn btn-outline btn-large">
                了解更多
              </a>
            </div>
          </div>
          <div className="hero__image">
            <div className="hero__illustration">
              <div className="illustration-card illustration-card--1">
                <p>文档编辑</p>
              </div>
              <div className="illustration-card illustration-card--2">
                <p>知识库</p>
              </div>
              <div className="illustration-card illustration-card--3">
                <p>团队协作</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 功能特性 */}
      <section id="features" className="features">
        <div className="container">
          <h2 className="features__title">核心功能</h2>
          <div className="features__grid">
            <div className="feature-card">
              <h3>Markdown 编辑</h3>
              <p>强大的 Markdown 编辑器，支持实时预览</p>
            </div>
            <div className="feature-card">
              <h3>思维导图</h3>
              <p>可视化思维导图，梳理知识脉络</p>
            </div>
            <div className="feature-card">
              <h3>AI 助手</h3>
              <p>智能 AI 辅助，提升创作效率</p>
            </div>
            <div className="feature-card">
              <h3>数据安全</h3>
              <p>端到端加密，保障数据隐私</p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

export default Home;
