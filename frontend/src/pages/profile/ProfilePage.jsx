import { useEffect, useState } from 'react';
import { CalendarBlank, Envelope } from '@phosphor-icons/react';
import { Card } from '../../components/ui/Card.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Alert } from '../../components/ui/Alert.jsx';
import { useAuth } from '../../hooks/useAuth.js';
import { userService } from '../../services/userService.js';
import { getProblemMessage } from '../../services/api.js';

function formatDate(value) {
  if (!value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '-' : new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long' }).format(date);
}

export function ProfilePage() {
  const { user, refreshUser, logout } = useAuth();
  const [profile, setProfile] = useState({ name: '', timezone: 'America/Sao_Paulo', locale: 'pt-BR' });
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '' });
  const [deletePassword, setDeletePassword] = useState('');
  const [saving, setSaving] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    setProfile({
      name: user?.name ?? '',
      timezone: user?.timezone ?? 'America/Sao_Paulo',
      locale: user?.locale ?? 'pt-BR',
    });
  }, [user]);

  const saveProfile = async (event) => {
    event.preventDefault();
    setSaving('profile');
    setError('');
    setSuccess('');
    try {
      await userService.updateProfile(profile);
      await refreshUser();
      setSuccess('Perfil atualizado.');
    } catch (e) {
      setError(getProblemMessage(e));
    } finally {
      setSaving('');
    }
  };

  const changePassword = async (event) => {
    event.preventDefault();
    setSaving('password');
    setError('');
    setSuccess('');
    try {
      await userService.changePassword(passwords);
      setPasswords({ currentPassword: '', newPassword: '' });
      setSuccess('Senha alterada. Entre novamente para continuar com uma sessao renovada.');
      await logout();
    } catch (e) {
      setError(getProblemMessage(e));
    } finally {
      setSaving('');
    }
  };

  const deleteAccount = async (event) => {
    event.preventDefault();
    if (!confirm('Excluir sua conta e todos os dados vinculados? Esta acao nao pode ser desfeita.')) return;
    setSaving('delete');
    setError('');
    try {
      await userService.deleteAccount(deletePassword);
      await logout();
    } catch (e) {
      setError(getProblemMessage(e));
    } finally {
      setSaving('');
    }
  };

  return (
    <div className="page">
      <header className="page-heading">
        <p className="eyebrow">Sua conta</p>
        <h1>Perfil</h1>
        <p>Atualize os dados permitidos da sua conta e gerencie a seguranca da sessao.</p>
      </header>
      {error && <Alert onDismiss={() => setError('')}>{error}</Alert>}
      {success && <Alert variant="success" onDismiss={() => setSuccess('')}>{success}</Alert>}
      <div className="split-grid">
        <Card className="profile-card">
          <div className="profile-avatar">{user?.name?.charAt(0)?.toUpperCase()}</div>
          <div><h2>{user?.name}</h2><p>Conta Habitus</p></div>
          <dl>
            <div><dt><Envelope /> E-mail</dt><dd>{user?.email}</dd></div>
            <div><dt><CalendarBlank /> Data de cadastro</dt><dd>{formatDate(user?.createdAt)}</dd></div>
          </dl>
        </Card>
        <Card className="panel">
          <h2>Editar perfil</h2>
          <form className="stack" onSubmit={saveProfile}>
            <Input label="Nome" value={profile.name} onChange={(event) => setProfile((current) => ({ ...current, name: event.target.value }))} required />
            <Input label="Fuso horario" value={profile.timezone} onChange={(event) => setProfile((current) => ({ ...current, timezone: event.target.value }))} />
            <Input label="Idioma" value={profile.locale} onChange={(event) => setProfile((current) => ({ ...current, locale: event.target.value }))} />
            <Button isLoading={saving === 'profile'}>Salvar perfil</Button>
          </form>
        </Card>
      </div>
      <div className="split-grid">
        <Card className="panel">
          <h2>Alterar senha</h2>
          <form className="stack" onSubmit={changePassword}>
            <Input label="Senha atual" type="password" showPasswordToggle value={passwords.currentPassword} onChange={(event) => setPasswords((current) => ({ ...current, currentPassword: event.target.value }))} required />
            <Input label="Nova senha" type="password" showPasswordToggle minLength="12" value={passwords.newPassword} onChange={(event) => setPasswords((current) => ({ ...current, newPassword: event.target.value }))} required />
            <Button isLoading={saving === 'password'}>Alterar senha</Button>
          </form>
        </Card>
        <Card className="panel danger-zone">
          <h2>Excluir conta</h2>
          <p className="muted">Esta acao remove perfil, habitos, diario, emocoes, telemetria e sessoes.</p>
          <form className="stack" onSubmit={deleteAccount}>
            <Input label="Confirme sua senha" type="password" showPasswordToggle value={deletePassword} onChange={(event) => setDeletePassword(event.target.value)} required />
            <Button isLoading={saving === 'delete'}>Excluir minha conta</Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
