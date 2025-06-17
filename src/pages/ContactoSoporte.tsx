
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Mail, Phone, MapPin, Clock, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { DashboardLayout } from '@/components/layout/DashboardLayout';

const ContactoSoporte = () => {
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    asunto: '',
    categoria: '',
    mensaje: ''
  });
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Simulamos el envío del formulario
    toast({
      title: "Mensaje enviado",
      description: "Hemos recibido tu consulta. Te responderemos en un plazo máximo de 24 horas.",
    });
    
    // Resetear formulario
    setFormData({
      nombre: '',
      email: '',
      asunto: '',
      categoria: '',
      mensaje: ''
    });
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-white p-4">
        <div className="max-w-6xl mx-auto py-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-green-800 mb-4">Contacto y Soporte</h1>
            <p className="text-xl text-gray-600">
              Estamos aquí para ayudarte. Contacta con nuestro equipo de soporte
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Información de contacto */}
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl text-green-800">Información de Contacto</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-start gap-4">
                  <Mail className="h-6 w-6 text-green-600 mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-800">Email</h3>
                    <p className="text-gray-600">soporte@farmapro.com</p>
                    <p className="text-gray-600">info@farmapro.com</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <Phone className="h-6 w-6 text-green-600 mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-800">Teléfono</h3>
                    <p className="text-gray-600">+34 900 123 456</p>
                    <p className="text-sm text-gray-500">Atención de lunes a viernes</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <MapPin className="h-6 w-6 text-green-600 mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-800">Dirección</h3>
                    <p className="text-gray-600">
                      Calle de la Farmacia, 123<br />
                      28001 Madrid, España
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <Clock className="h-6 w-6 text-green-600 mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-800">Horario de Atención</h3>
                    <p className="text-gray-600">
                      Lunes a Viernes: 9:00 - 18:00<br />
                      Sábados: 10:00 - 14:00<br />
                      Domingos: Cerrado
                    </p>
                  </div>
                </div>

                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-green-800 mb-2">Soporte Técnico Urgente</h3>
                  <p className="text-sm text-green-700">
                    Para incidencias técnicas urgentes durante exámenes o evaluaciones, 
                    contacta al +34 900 999 000 (disponible 24/7)
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Formulario de contacto */}
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl text-green-800">Envíanos un Mensaje</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="nombre">Nombre Completo</Label>
                    <Input
                      id="nombre"
                      type="text"
                      value={formData.nombre}
                      onChange={(e) => handleChange('nombre', e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="categoria">Categoría de Consulta</Label>
                    <Select value={formData.categoria} onValueChange={(value) => handleChange('categoria', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona una categoría" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tecnico">Soporte Técnico</SelectItem>
                        <SelectItem value="cursos">Consultas sobre Cursos</SelectItem>
                        <SelectItem value="certificados">Certificados y Diplomas</SelectItem>
                        <SelectItem value="facturacion">Facturación y Pagos</SelectItem>
                        <SelectItem value="cuenta">Gestión de Cuenta</SelectItem>
                        <SelectItem value="general">Consulta General</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="asunto">Asunto</Label>
                    <Input
                      id="asunto"
                      type="text"
                      value={formData.asunto}
                      onChange={(e) => handleChange('asunto', e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="mensaje">Mensaje</Label>
                    <Textarea
                      id="mensaje"
                      rows={5}
                      value={formData.mensaje}
                      onChange={(e) => handleChange('mensaje', e.target.value)}
                      placeholder="Describe tu consulta o problema de forma detallada..."
                      required
                    />
                  </div>

                  <Button type="submit" className="w-full bg-green-600 hover:bg-green-700">
                    <Send className="h-4 w-4 mr-2" />
                    Enviar Mensaje
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* FAQ rápido */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="text-2xl text-green-800">Preguntas Frecuentes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">¿Cómo accedo a mis certificados?</h3>
                  <p className="text-sm text-gray-600">
                    Los certificados están disponibles en tu perfil, sección "Mis Certificados", 
                    una vez completados los cursos correspondientes.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">¿Puedo cambiar mi plan de suscripción?</h3>
                  <p className="text-sm text-gray-600">
                    Sí, puedes cambiar tu plan en cualquier momento desde la sección "Suscripción" 
                    en tu panel de usuario.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">¿Los cursos tienen fecha límite?</h3>
                  <p className="text-sm text-gray-600">
                    La mayoría de cursos son autoguiados sin fecha límite, excepto los cursos en vivo 
                    que tienen fechas específicas.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">¿Cómo reseteo mi contraseña?</h3>
                  <p className="text-sm text-gray-600">
                    Utiliza la opción "¿Olvidaste tu contraseña?" en la página de inicio de sesión 
                    o contacta con soporte.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ContactoSoporte;
