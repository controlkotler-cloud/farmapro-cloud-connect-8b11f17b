import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Gift, Calendar, Building2, ExternalLink, Clock, Tag, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import { AccessRestriction } from '@/components/subscription/AccessRestriction';
import { useAccessControl } from '@/hooks/useAccessControl';

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

const Promociones = () => {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState('all');
  const { restrictions } = useAccessControl();

  // Array de imágenes para promociones farmacéuticas
  const promotionImages = [
    'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=400&h=300&fit=crop&auto=format', // farmacia moderna
    'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&h=300&fit=crop&auto=format', // productos farmacéuticos
    'https://images.unsplash.com/photo-1585435557343-3b092031c777?w=400&h=300&fit=crop&auto=format', // medicina y salud
    'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=400&h=300&fit=crop&auto=format', // laboratorio
    'https://images.unsplash.com/photo-1563213126-a4273aed2016?w=400&h=300&fit=crop&auto=format', // píldoras y medicamentos
    'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&h=300&fit=crop&auto=format', // equipo médico
    'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=400&h=300&fit=crop&auto=format', // investigación médica
    'https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=400&h=300&fit=crop&auto=format', // medicina alternativa
    'https://images.unsplash.com/photo-1571772996211-2f02c9727629?w=400&h=300&fit=crop&auto=format', // cápsulas
    'https://images.unsplash.com/photo-1628595351029-c2bf17511435?w=400&h=300&fit=crop&auto=format' // farmacéutico trabajando
  ];

  const companyTypes = [
    { id: 'all', name: 'Todas las Ofertas' },
    { id: 'laboratorio', name: 'Laboratorios' },
    { id: 'distribuidor', name: 'Distribuidores' },
    { id: 'software', name: 'Software' },
    { id: 'equipos', name: 'Equipos' },
    { id: 'formacion', name: 'Formación' },
    { id: 'servicios', name: 'Servicios' },
  ];

  useEffect(() => {
    loadPromotions();
  }, [selectedType]);

  const loadPromotions = async () => {
    setLoading(true);
    let query = supabase
      .from('promotions')
      .select('*')
      .eq('is_active', true)
      .gte('valid_until', new Date().toISOString())
      .order('created_at', { ascending: false });

    if (selectedType !== 'all') {
      query = query.eq('company_type', selectedType);
    }

    const { data, error } = await query;
    if (error) {
      console.error('Error loading promotions:', error);
    } else {
      setPromotions(data || []);
    }
    setLoading(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const isExpiringSoon = (validUntil: string) => {
    const expiryDate = new Date(validUntil);
    const today = new Date();
    const diffInDays = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diffInDays <= 7;
  };

  const getCompanyTypeColor = (type: string) => {
    switch (type) {
      case 'laboratorio':
        return 'bg-blue-100 text-blue-800';
      case 'distribuidor':
        return 'bg-green-100 text-green-800';
      case 'software':
        return 'bg-purple-100 text-purple-800';
      case 'equipos':
        return 'bg-orange-100 text-orange-800';
      case 'formacion':
        return 'bg-indigo-100 text-indigo-800';
      case 'servicios':
        return 'bg-pink-100 text-pink-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPromotionImage = (index: number) => {
    return promotionImages[index % promotionImages.length];
  };

  const isPremiumPromotion = (promotion: Promotion) => {
    // Considera promociones premium aquellas de laboratorios o equipos
    return promotion.company_type === 'laboratorio' || promotion.company_type === 'equipos';
  };

  return (
    <AccessRestriction
      requiredPlan="profesional"
      featureName="Promociones Premium"
      className={!restrictions.canAccessPremiumPromotions ? "min-h-[600px]" : ""}
    >
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Promociones Exclusivas</h1>
          <p className="text-gray-600">Descuentos y ofertas especiales para farmacias</p>
        </div>

        <Tabs value={selectedType} onValueChange={setSelectedType}>
          <TabsList className="grid w-full grid-cols-6">
            {companyTypes.map((type) => (
              <TabsTrigger key={type.id} value={type.id} className="text-xs">
                {type.name}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={selectedType} className="mt-6">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <div className="h-48 bg-gray-200"></div>
                    <CardContent className="p-6">
                      <div className="h-4 bg-gray-200 rounded mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {promotions.map((promotion, index) => {
                  const isRestricted = isPremiumPromotion(promotion) && !restrictions.canAccessPremiumPromotions;
                  
                  return (
                    <motion.div
                      key={promotion.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                    >
                      {isRestricted ? (
                        <AccessRestriction
                          requiredPlan="profesional"
                          featureName={`Promoción: ${promotion.title}`}
                        >
                          <Card className="h-full hover:shadow-lg transition-shadow">
                            <div className="relative">
                              <img 
                                src={promotion.image_url || getPromotionImage(index)} 
                                alt={promotion.title}
                                className="w-full h-48 object-cover rounded-t-lg"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.src = getPromotionImage(index);
                                }}
                              />
                              <div className="absolute top-2 left-2 space-y-1">
                                <Badge className="bg-gradient-to-r from-red-500 to-pink-600">
                                  <Gift className="h-3 w-3 mr-1" />
                                  Oferta
                                </Badge>
                                {isExpiringSoon(promotion.valid_until) && (
                                  <Badge className="bg-orange-600">
                                    <Clock className="h-3 w-3 mr-1" />
                                    ¡Últimos días!
                                  </Badge>
                                )}
                              </div>
                              <Badge className={`absolute top-2 right-2 ${getCompanyTypeColor(promotion.company_type)}`}>
                                {promotion.company_type}
                              </Badge>
                            </div>
                            <CardHeader>
                              <CardTitle className="text-lg">{promotion.title}</CardTitle>
                              <div className="flex items-center text-gray-600">
                                <Building2 className="h-4 w-4 mr-1" />
                                {promotion.company_name}
                              </div>
                              <CardDescription>{promotion.description}</CardDescription>
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
                                  <Calendar className="h-4 w-4 mr-2" />
                                  Válido hasta: {formatDate(promotion.valid_until)}
                                </div>

                                {promotion.terms_conditions && (
                                  <details className="text-xs text-gray-600">
                                    <summary className="cursor-pointer font-medium">Términos y condiciones</summary>
                                    <p className="mt-2 pl-4">{promotion.terms_conditions}</p>
                                  </details>
                                )}

                                <Button className="w-full mt-4">
                                  <ExternalLink className="h-4 w-4 mr-2" />
                                  Solicitar
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        </AccessRestriction>
                      ) : (
                        <Card className="h-full hover:shadow-lg transition-shadow">
                          <div className="relative">
                            <img 
                              src={promotion.image_url || getPromotionImage(index)} 
                              alt={promotion.title}
                              className="w-full h-48 object-cover rounded-t-lg"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = getPromotionImage(index);
                              }}
                            />
                            <div className="absolute top-2 left-2 space-y-1">
                              <Badge className="bg-gradient-to-r from-red-500 to-pink-600">
                                <Gift className="h-3 w-3 mr-1" />
                                Oferta
                              </Badge>
                              {isExpiringSoon(promotion.valid_until) && (
                                <Badge className="bg-orange-600">
                                  <Clock className="h-3 w-3 mr-1" />
                                  ¡Últimos días!
                                </Badge>
                              )}
                            </div>
                            <Badge className={`absolute top-2 right-2 ${getCompanyTypeColor(promotion.company_type)}`}>
                              {promotion.company_type}
                            </Badge>
                          </div>
                          <CardHeader>
                            <CardTitle className="text-lg">{promotion.title}</CardTitle>
                            <div className="flex items-center text-gray-600">
                              <Building2 className="h-4 w-4 mr-1" />
                              {promotion.company_name}
                            </div>
                            <CardDescription>{promotion.description}</CardDescription>
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
                                <Calendar className="h-4 w-4 mr-2" />
                                Válido hasta: {formatDate(promotion.valid_until)}
                              </div>

                              {promotion.terms_conditions && (
                                <details className="text-xs text-gray-600">
                                  <summary className="cursor-pointer font-medium">Términos y condiciones</summary>
                                  <p className="mt-2 pl-4">{promotion.terms_conditions}</p>
                                </details>
                              )}

                              <Button className="w-full mt-4">
                                <ExternalLink className="h-4 w-4 mr-2" />
                                Solicitar
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {promotions.length === 0 && !loading && (
          <Card className="text-center py-12">
            <CardContent>
              <Gift className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No hay promociones disponibles</h3>
              <p className="text-gray-600">
                {selectedType === 'all' 
                  ? 'No hay promociones activas en este momento.'
                  : `No hay promociones de tipo "${companyTypes.find(t => t.id === selectedType)?.name}" disponibles.`
                }
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </AccessRestriction>
  );
};

export default Promociones;
