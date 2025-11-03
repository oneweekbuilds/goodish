import { useNavigate, useParams } from 'react-router-dom';
import { InsightDetailPage } from '../figma-ui/pages/InsightDetailPage';

export default function InsightDetail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  return <InsightDetailPage onNavigate={(path) => navigate('/' + path)} topic={id} />;
}

