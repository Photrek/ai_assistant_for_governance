import * as React from 'react';
import Sheet from '@mui/joy/Sheet';
import Input from '@mui/joy/Input';
import Button from '@mui/joy/Button';
import Typography from '@mui/joy/Typography';
import Box from '@mui/joy/Box';

interface LoginBoxProps {
  onLogin?: (username: string, password: string) => void;
}

export const LoginBox: React.FC<LoginBoxProps> = ({ onLogin }) => {
  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (onLogin) {
      onLogin(username, password);
    }
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        width: '100%',
        maxWidth: 300,
        p: 2,
        bgcolor: 'background.paper',
        borderRadius: 'sm',
        boxShadow: 'sm',
      }}
    >
      <Typography level="h6" component="h2">
        Login
      </Typography>
      <Input
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        required
        sx={{ width: '100%' }}
      />
      <Input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        sx={{ width: '100%' }}
      />
      <Button type="submit" variant="solid" color="primary">
        Log In
      </Button>
    </Box>
  );
};

export const TemplateView: React.FC = () => {
  return (
    <Sheet
      sx={{
        top: 60,
        left: 60,
        width: 1200,
        height: 800,
        overflowY: 'auto',
        p: 4,
        bgcolor: 'background.body',
        color: 'text.primary',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <LoginBox
        onLogin={(username, password) => console.log(`Username: ${username}, Password: ${password}`)}
      />
    </Sheet>
  );
};