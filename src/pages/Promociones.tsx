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

// Portada de marca por tipo de partner (color plano + icono), nada de fotos de stock.
// Misma paleta reducida y misma reutilización que PromotionCategoryFilter (salvia para
// laboratorio/formacion, terracota para distribuidor/servicios) para que la categoría
// se reconozca de un vistazo en todo el flujo de Promociones.
const PROMO_COVER: Record<string, { bg: string; Icon: LucideIcon }> = {
  laboratorio: { bg: 'bg-salvia', Icon: FlaskConical },
  distribuidor: { bg: 'bg-terracota', Icon: Truck },
  software: { bg: 'bg-ciruela', Icon: Monitor },
  equipos: { bg: 'bg-miel', Icon: Wrench },
  formacion: { bg: 'bg-salvia', Icon: GraduationCap },
  servicios: { bg: 'bg-terracota', Icon: Handshake },
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

  // Misma paleta reducida y reutilización que PROMO_COVER/PromotionCategoryFilter.
  const getCompanyTypeColor = (type: string | null) => {
    if (!type) return 'bg-muted text-muted-foreground';
    switch (type.toLowerCase()) {
      case 'laboratorio': return 'bg-salvia-soft text-salvia';
      case 'distribuidor': return 'bg-terracota-soft text-terracota';
      case 'software': return 'bg-ciruela-soft text-ciruela';
      case 'equipos': return 'bg-miel-soft text-miel';
      case 'formacion': return 'bg-salvia-soft text-salvia';
      case 'servicios': return 'bg-terracota-soft text-terracota';
      default: return 'bg-muted text-muted-foreground';
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
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl [text-wrap:balance]">
            La Rebotica regala; aquí <em className="italic-display">se ofrece</em>
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Códigos y ofertas de partners, siempre con las condiciones claras.
          </p>
        </div>
        {noPromotionsAtAll && (
          <span className="inline-flex flex-none items-center rounded-full bg-miel-soft px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-miel">
            Próximamente
          </span>
        )}
      </div>

      {noPromotionsAtAll ? (
        /* Teaser: aún no hay ofertas cargadas */
        <Card className="border-dashed shadow-soft">
          <CardContent className="text-center py-14 px-6 space-y-5 max-w-2xl mx-auto">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-miel-soft">
              <Gift className="h-8 w-8 text-miel" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">Ofertas del sector, muy pronto</h2>
            <p className="text-muted-foreground">
              Estamos cerrando acuerdos con partners del sector para traerte ofertas y
              descuentos exclusivos: dermocosmética, parafarmacia, formación, equipamiento y
              servicios. Todo en un mismo sitio, pensado para que tu farmacia ahorre y gane.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5"><BadgePercent className="h-4 w-4 text-miel" /> Descuentos exclusivos</span>
              <span className="inline-flex items-center gap-1.5"><Building2 className="h-4 w-4 text-miel" /> Partners del sector</span>
            </div>
            <Button
              onClick={notifyInterest}
              className="gap-2 rounded-full bg-brand-dark px-5 py-2.5 text-sm font-bold text-white shadow-soft transition-all hover:-translate-y-0.5 hover:bg-brand-dark hover:shadow-lift"
            >
              <Bell className="h-4 w-4" />
              ¿Te interesaría recibir ofertas del sector? Avísame
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <PromotionCategoryFilter selectedType={selectedType} onTypeChange={setSelectedType} />

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <div className="h-44 bg-muted rounded-t-lg"></div>
                  <CardContent className="p-6">
                    <div className="h-4 bg-muted rounded mb-2"></div>
                    <div className="h-3 bg-muted rounded"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : promotions.length === 0 ? (
            <Card className="text-center py-12 border-border shadow-soft">
              <CardContent>
                <Gift className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No hay promociones de este tipo</h3>
                <p className="text-muted-foreground">Prueba con otra categoría.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {promotions.map((promotion, index) => {
                const cover = PROMO_COVER[(promotion.company_type || '').toLowerCase()] || {
                  bg: 'bg-miel', Icon: Gift,
                };
                const featured = index === 0;
                return (
                  <motion.div
                    key={promotion.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: Math.min(index, 8) * 0.1 }}
                  >
                    <Card
                      className={`h-full overflow-hidden border-border shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift group ${
                        featured ? 'bg-gradient-to-br from-miel-soft to-card' : ''
                      }`}
                    >
                      <div className="relative h-44 overflow-hidden rounded-t-lg">
                        {promotion.image_url ? (
                          <img
                            src={promotion.image_url}
                            alt={promotion.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                          />
                        ) : (
                          <div className={`w-full h-full ${cover.bg} flex items-center justify-center`}>
                            <cover.Icon className="h-14 w-14 text-primary-foreground/90" strokeWidth={1.5} />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                        <div className="absolute top-3 left-3 flex flex-col items-start gap-2">
                          <span className="inline-flex items-center gap-1 rounded-full bg-miel-soft px-2.5 py-0.5 text-[10.5px] font-extrabold uppercase tracking-[0.12em] text-miel shadow-soft">
                            <Gift className="h-3 w-3" />
                            Oferta
                          </span>
                          {promotion.valid_until && isExpiringSoon(promotion.valid_until) && (
                            <Badge className="bg-warning text-warning-foreground shadow-soft text-[10.5px] font-extrabold uppercase tracking-[0.12em]">
                              <Clock className="h-3 w-3 mr-1" />
                              ¡Últimos días!
                            </Badge>
                          )}
                        </div>
                        <span
                          className={`absolute top-3 right-3 inline-flex items-center rounded-full px-2.5 py-0.5 text-[10.5px] font-extrabold uppercase tracking-[0.12em] shadow-soft ${getCompanyTypeColor(promotion.company_type)}`}
                        >
                          {promotion.company_type}
                        </span>
                      </div>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg line-clamp-2 group-hover:text-miel transition-colors">
                          {promotion.title}
                        </CardTitle>
                        <div className="flex items-center text-muted-foreground">
                          <Building2 className="h-4 w-4 mr-1" />
                          {promotion.company_name}
                        </div>
                        <CardDescription className="line-clamp-3 text-muted-foreground">
                          {promotion.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="space-y-3">
                          {promotion.discount_details && (
                            <div className="p-3 bg-miel-soft rounded-lg border border-miel/20">
                              <div className="flex items-center mb-1">
                                <Tag className="h-4 w-4 mr-2 text-miel" />
                                <span className="font-medium text-miel">Oferta:</span>
                              </div>
                              <p className="text-sm text-foreground">{promotion.discount_details}</p>
                            </div>
                          )}
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4 mr-2 text-miel" />
                            Válido hasta: {formatDate(promotion.valid_until)}
                          </div>
                          {promotion.terms_conditions && (
                            <details className="text-xs text-muted-foreground">
                              <summary className="cursor-pointer font-medium">Términos y condiciones</summary>
                              <p className="mt-2 pl-4">{promotion.terms_conditions}</p>
                            </details>
                          )}
                          <Button
                            className="w-full mt-4 gap-2 rounded-full bg-brand-dark px-5 py-2.5 text-sm font-bold text-white shadow-soft transition-all hover:-translate-y-0.5 hover:bg-brand-dark hover:shadow-lift"
                          >
                            <ExternalLink className="h-4 w-4" />
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
