import { useNavigate } from 'react-router-dom';
import { AboutPage } from '../figma-ui/pages/AboutPage';

export default function About() {
  const navigate = useNavigate();
  return <AboutPage onNavigate={(path) => navigate('/' + path)} />;
}
