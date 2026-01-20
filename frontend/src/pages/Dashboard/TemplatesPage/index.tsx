import { useState, useEffect } from 'react';
import { PageHeader, EmptyState } from '@/components';
import { fetchTemplates } from '@/api/templates';
import type { Template } from '@/types/template';
import TemplateCard from './TemplateCard';
import TemplatePreviewModal from './TemplatePreviewModal';
import './TemplatesPage.scss';

function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const res = await fetchTemplates();
      if (res.code === 0 && res.data) {
        setTemplates(res.data);
      } else {
        setError(res.message || '加载失败');
      }
    } catch (err) {
      setError('加载模板失败');
    } finally {
      setLoading(false);
    }
  };

  const handleTemplateClick = (template: Template) => {
    setSelectedTemplate(template);
    setIsModalOpen(true);
  };

  const systemTemplates = templates.filter((t) => t.is_system);
  const userTemplates = templates.filter((t) => !t.is_system);

  return (
    <div className="templates-page">
      <PageHeader title="模板" icon="📋" />

      <div className="templates-page__content">
        {loading ? (
          <div className="templates-page__loading">加载中...</div>
        ) : error ? (
          <EmptyState
            icon="⚠️"
            title="加载失败"
            description={error}
          />
        ) : templates.length === 0 ? (
          <EmptyState
            icon="📋"
            title="暂无模板"
            description="系统模板正在准备中"
          />
        ) : (
          <>
            {/* 系统模板 */}
            <section className="templates-page__section">
              <h2 className="templates-page__section-title">系统模板</h2>
              <div className="templates-page__grid">
                {systemTemplates.map((template) => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    onClick={() => handleTemplateClick(template)}
                  />
                ))}
              </div>
            </section>

            {/* 用户模板 */}
            {userTemplates.length > 0 && (
              <section className="templates-page__section">
                <h2 className="templates-page__section-title">我的模板</h2>
                <div className="templates-page__grid">
                  {userTemplates.map((template) => (
                    <TemplateCard
                      key={template.id}
                      template={template}
                      onClick={() => handleTemplateClick(template)}
                    />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>

      <TemplatePreviewModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        template={selectedTemplate}
      />
    </div>
  );
}

export default TemplatesPage;
