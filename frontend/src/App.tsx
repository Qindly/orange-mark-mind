import { RouterProvider } from 'react-router-dom';
import router from './router';
import { useAuthStore } from './stores/authStore';
import './styles/global.scss';

// 应用启动时从 localStorage 恢复登录状态
useAuthStore.getState().hydrate();

function App() {
  return <RouterProvider router={router} />;
}

export default App;
