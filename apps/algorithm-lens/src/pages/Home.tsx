import { useNavigate } from 'react-router-dom';
import LandingPage from '../figma-ui/pages/LandingPage';

export default function Home() {
  const navigate = useNavigate();
  return <LandingPage onNavigate={(path) => navigate('/' + path)} />;
}
