import { PageHeader, EmptyState } from '@/components';
import './TemplatesPage.scss';

function TemplatesPage() {
  return (
    <div className="templates-page">
      <PageHeader title="模板" icon="📋" />

      <div className="templates-page__content">
        <EmptyState 
          icon="📋" 
          title="模板功能开发中" 
          description="敬请期待，我们正在准备精美模板" 
        />
      </div>
    </div>
  );
}

export default TemplatesPage;
