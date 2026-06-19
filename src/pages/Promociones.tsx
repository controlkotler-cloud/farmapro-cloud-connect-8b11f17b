import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Gift, Calendar, Building2, ExternalLink, Clock, Tag, Bell, BadgePercent,
  FlaskConical, Truck, Monitor, Wrench, GraduationCap, Handshake,
  type LucideIcon,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { PromotionCategoryFilter } from '@/components/admin/promotion/PromotionCategoryFilter';
import { useToast } from '@/hooks/use-toast';

interface Promotion {
  id: string;
  title: string;
  description: string;
  company_name: string;
  company_type: string;
  discount_details: string;
  terms_conditions: string;
  image_url: string;
  valid_until: string;
  is_active: boolean;
  created_at: string;
}

// Portada de marca por tipo de partner (color + icono), nada de fotos de stock.
const PROMO_COVER: Record<string, { gradient: string; Icon: LucideIcon }> = {
  laboratorio: { gradient: 'from-blue-500 to-indigo-600', Icon: FlaskConical },
  distribuidor: { gradient: 'from-emerald-500 to-green-600', Icon: Truck },
  software: { gradient: 'from-violet-500 to-purple-600', Icon: Monitor },
  equipos: { gradient: 'from-amber-500 to-orange-600', Icon: Wrench },
  formacion: { gradient: 'from-sky-500 to-blue-600', Icon: GraduationCap },
  servicios: { gradient: 'from-pink-500 to-rose-600', Icon: Handshake },
};

const Promociones = () => {
  const { toast } = useToast();
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState('all');

  useEffect(() => {
    loadPromotions();
  }, [selectedType]);

  const loadPromotions = async () => {
    setLoading(true);
    let query = supabase
      .from('promotions')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (selectedType !== 'all') {
      query = query.eq('company_type', selectedType);
    }

    const { data, error } = await query;
    if (error) {
      console.error('Error loading promotions:', error);
    } else {
      const valid = (data || []).filter((p) => {
        if (!p.valid_until) return true;
        return new Date(p.valid_until) > new Date();
      });
      setPromotions(valid);
    }
    setLoading(false);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Sin fecha límite';
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric', month: 'long', day: 'numeric',
    });
  };

  const isExpiringSoon = (validUntil: string) => {
    if (!validUntil) return false;
    const diff = Math.ceil((new Date(validUntil).getTime() - Date.now()) / 86_400_000);
    return diff <= 7 && diff > 0;
  };

  const getCompanyTypeColor = (type: string | null) => {
    if (!type) return 'bg-gray-100 text-gray-800';
    switch (type.toLowerCase()) {
      case 'laboratorio': return 'bg-blue-100 text-blue-800';
      case 'distribuidor': return 'bg-green-100 text-green-800';
      case 'software': return 'bg-purple-100 text-purple-800';
      case 'equipos': return 'bg-orange-100 text-orange-800';
      case 'formacion': return 'bg-indigo-100 text-indigo-800';
      case 'servicios': return 'bg-pink-100 text-pink-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const notifyInterest = () => {
    toast({
      title: '¡Genial!',
      description: 'Te avisaremos en cuanto las promociones del sector estén disponibles.',
    });
  };

  // El teaser se muestra cuando, sin filtro aplicado, no hay ninguna promoción activa todavía.
  const noPromotionsAtAll = !loading && selectedType === 'all' && promotions.length === 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        className="bg-gradient-to-r from-red-50 to-red-100 rounded-xl p-8 shadow-lg ring-1 ring-red-200"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="relative">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-16 bg-gradient-to-b from-red-400 to-red-600 rounded-r-full shadow-lg"></div>
          <div className="ml-6">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-gray-900">Promociones</h1>
              {noPromotionsAtAll && <Badge className="bg-red-600 text-white">Próximamente</Badge>}
            </div>
            <p className="text-gray-600">Ofertas y descuentos exclusivos del sector para tu farmacia</p>
          </div>
        </div>
      </motion.div>

      {noPromotionsAtAll ? (
        /* Teaser: aún no hay ofertas cargadas */
        <Card className="border-dashed">
          <CardContent className="text-center py-14 px-6 space-y-5 max-w-2xl mx-auto">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500 to-pink-600 text-white flex items-center justify-center">
              <Gift className="h-8 w-8" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Ofertas del sector, muy pronto</h2>
            <p className="text-muted-foreground">
              Estamos cerrando acuerdos con partners del sector para traerte ofertas y
              descuentos exclusivos: dermocosmética, parafarmacia, formación, equipamiento y
              servicios. Todo en un mismo sitio, pensado para que tu farmacia ahorre y gane.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5"><BadgePercent className="h-4 w-4 text-red-500" /> Descuentos exclusivos</span>
              <span className="inline-flex items-center gap-1.5"><Building2 className="h-4 w-4 text-red-500" /> Partners del sector</span>
            </div>
            <Button onClick={notifyInterest} className="bg-red-600 hover:bg-red-700 text-white">
              <Bell className="h-4 w-4 mr-2" />
              ¿Te interesaría recibir ofertas del sector? Avísame
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
          <PromotionCategoryFilter selectedType={selectedType} onTypeChange={setSelectedType} />

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <div className="h-44 bg-gray-200 rounded-t-lg"></div>
                  <CardContent className="p-6">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : promotions.length === 0 ? (
            <Card className="text-center py-12 border-gray-200 shadow-sm">
              <CardContent>
                <Gift className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No hay promociones de este tipo</h3>
                <p className="text-gray-600">Prueba con otra categoría.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {promotions.map((promotion, index) => {
                const cover = PROMO_COVER[(promotion.company_type || '').toLowerCase()] || {
                  gradient: 'from-red-500 to-pink-600', Icon: Gift,
                };
                return (
                  <motion.div
                    key={promotion.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: Math.min(index, 8) * 0.1 }}
                  >
                    <Card className="h-full hover:shadow-xl transition-all duration-300 border-gray-200 group">
                      <div className="relative h-44 overflow-hidden rounded-t-lg">
                        {promotion.image_url ? (
                          <img
                            src={promotion.image_url}
                            alt={promotion.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                          />
                        ) : (
                          <div className={`w-full h-full bg-gradient-to-br ${cover.gradient} flex items-center justify-center`}>
                            <cover.Icon className="h-14 w-14 text-white/90" strokeWidth={1.5} />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                        <div className="absolute top-3 left-3 space-y-2">
                          <Badge className="bg-gradient-to-r from-red-500 to-pink-600 text-white shadow-lg">
                            <Gift className="h-3 w-3 mr-1" />
                            Oferta
                          </Badge>
                          {promotion.valid_until && isExpiringSoon(promotion.valid_until) && (
                            <Badge className="bg-orange-600 text-white shadow-lg">
                              <Clock className="h-3 w-3 mr-1" />
                              ¡Últimos días!
                            </Badge>
                          )}
                        </div>
                        <Badge className={`absolute top-3 right-3 ${getCompanyTypeColor(promotion.company_type)} shadow-lg`}>
                          {promotion.company_type}
                        </Badge>
                      </div>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg line-clamp-2 group-hover:text-red-600 transition-colors">
                          {promotion.title}
                        </CardTitle>
                        <div className="flex items-center text-gray-600">
                          <Building2 className="h-4 w-4 mr-1" />
                          {promotion.company_name}
                        </div>
                        <CardDescription className="line-clamp-3 text-gray-600">
                          {promotion.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="space-y-3">
                          {promotion.discount_details && (
                            <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                              <div className="flex items-center mb-1">
                                <Tag className="h-4 w-4 mr-2 text-green-600" />
                                <span className="font-medium text-green-800">Oferta:</span>
                              </div>
                              <p className="text-sm text-green-700">{promotion.discount_details}</p>
                            </div>
                          )}
                          <div className="flex items-center text-sm text-gray-600">
                            <Calendar className="h-4 w-4 mr-2 text-red-500" />
                            Válido hasta: {formatDate(promotion.valid_until)}
                          </div>
                          {promotion.terms_conditions && (
                            <details className="text-xs text-gray-600">
                              <summary className="cursor-pointer font-medium">Términos y condiciones</summary>
                              <p className="mt-2 pl-4">{promotion.terms_conditions}</p>
                            </details>
                          )}
                          <Button className="w-full mt-4 bg-red-600 hover:bg-red-700 text-white shadow-lg">
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Solicitar
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Promociones;
