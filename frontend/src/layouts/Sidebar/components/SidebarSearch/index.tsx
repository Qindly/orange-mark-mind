import './SidebarSearch.scss';

interface SidebarSearchProps {
  onNewDocument?: () => void;
}

function SidebarSearch({ onNewDocument }: SidebarSearchProps) {
  return (
    <div className="sidebar-search">
      <div className="sidebar-search__input-wrapper">
        <span className="sidebar-search__icon">🔍</span>
        <input 
          type="text" 
          className="sidebar-search__input" 
          placeholder="搜索"
        />
      </div>
      <button 
        className="sidebar-search__new-btn" 
        title="新建文档"
        onClick={onNewDocument}
      >
        +
      </button>
    </div>
  );
}

export default SidebarSearch;
