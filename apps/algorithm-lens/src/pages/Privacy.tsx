import { useNavigate } from 'react-router-dom';
import { PrivacyTermsPage } from '../figma-ui/pages/PrivacyTermsPage';

export default function Privacy() {
  const navigate = useNavigate();
  return <PrivacyTermsPage onNavigate={(path) => navigate('/' + path)} />;
}
