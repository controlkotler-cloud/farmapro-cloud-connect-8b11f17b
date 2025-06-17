
import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { AuthHeader } from './AuthHeader';
import { AuthForm } from './AuthForm';

export const LoginForm = () => {
  const [isRegistering, setIsRegistering] = useState(false);

  const toggleMode = () => {
    setIsRegistering(!isRegistering);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="w-full max-w-md shadow-2xl">
          <CardHeader>
            <AuthHeader isRegistering={isRegistering} />
          </CardHeader>
          <CardContent>
            <AuthForm 
              isRegistering={isRegistering} 
              onToggleMode={toggleMode} 
            />
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};
