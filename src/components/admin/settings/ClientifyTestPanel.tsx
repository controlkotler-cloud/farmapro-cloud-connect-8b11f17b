import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useClientifySync } from '@/hooks/useClientifySync';
import { useAuth } from '@/hooks/useAuth';
import { Send, User, RefreshCw } from 'lucide-react';

export const ClientifyTestPanel = () => {
  const { syncCurrentUser, sendEmail, loading } = useClientifySync();
  const { user } = useAuth();
  const [testEmail, setTestEmail] = useState('');
  const [testSubject, setTestSubject] = useState('Test desde farmapro');
  const [testMessage, setTestMessage] = useState('Este es un email de prueba desde la integración con Clientify.');

  const handleSyncUser = async () => {
    const result = await syncCurrentUser();
    if (result) {
      console.log('Usuario sincronizado:', result);
    }
  };

  const handleSendTestEmail = async () => {
    if (!testEmail) return;
    
    const result = await sendEmail(
      testEmail,
      testSubject,
      `<h2>${testSubject}</h2><p>${testMessage}</p><p>Enviado desde: ${user?.email}</p>`
    );
    
    if (result) {
      console.log('Email enviado:', result);
      setTestEmail('');
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Send className="h-5 w-5" />
          Panel de Pruebas Clientify
        </CardTitle>
        <CardDescription>
          Prueba la integración con Clientify para sincronización y envío de emails
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Sincronización de usuario */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Sincronización de Usuario</Label>
          <div className="flex items-center gap-3">
            <Button 
              onClick={handleSyncUser}
              disabled={loading || !user}
              className="flex items-center gap-2"
            >
              <User className="h-4 w-4" />
              {loading ? 'Sincronizando...' : 'Sincronizar Usuario Actual'}
            </Button>
            {user && (
              <span className="text-sm text-gray-600">
                Usuario: {user.email}
              </span>
            )}
          </div>
        </div>

        {/* Envío de email de prueba */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Envío de Email de Prueba</Label>
          <div className="space-y-3">
            <div>
              <Label htmlFor="test-email">Email destino</Label>
              <Input
                id="test-email"
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="email@ejemplo.com"
              />
            </div>
            <div>
              <Label htmlFor="test-subject">Asunto</Label>
              <Input
                id="test-subject"
                value={testSubject}
                onChange={(e) => setTestSubject(e.target.value)}
                placeholder="Asunto del email"
              />
            </div>
            <div>
              <Label htmlFor="test-message">Mensaje</Label>
              <Input
                id="test-message"
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                placeholder="Contenido del mensaje"
              />
            </div>
            <Button 
              onClick={handleSendTestEmail}
              disabled={loading || !testEmail}
              className="flex items-center gap-2"
            >
              <Send className="h-4 w-4" />
              {loading ? 'Enviando...' : 'Enviar Email de Prueba'}
            </Button>
          </div>
        </div>

        {/* Indicador de estado */}
        {loading && (
          <div className="flex items-center gap-2 text-blue-600">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span className="text-sm">Procesando con Clientify...</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};