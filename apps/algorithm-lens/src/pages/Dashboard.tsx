import { useNavigate } from 'react-router-dom';
import DashboardPage from '../figma-ui/pages/DashboardPage';

export default function Dashboard() {
  const navigate = useNavigate();
  return <DashboardPage onNavigate={(path) => navigate('/' + path)} />;
}
