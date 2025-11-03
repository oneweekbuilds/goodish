import { useNavigate } from 'react-router-dom';
import { SignInPage } from '../figma-ui/pages/SignInPage';

export default function SignIn() {
  const navigate = useNavigate();
  return <SignInPage onNavigate={(path) => navigate('/' + path)} />;
}

