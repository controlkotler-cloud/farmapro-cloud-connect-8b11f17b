
interface UserInfoProps {
  email?: string;
  fullName?: string;
  pharmacyName?: string;
}

export const UserInfo = ({ email, fullName, pharmacyName }: UserInfoProps) => {
  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        Información de Usuario
      </h3>
      <div className="space-y-2">
        <p className="text-gray-600">
          <span className="font-medium">Email:</span> {email}
        </p>
        <p className="text-gray-600">
          <span className="font-medium">Nombre:</span> {fullName || 'No especificado'}
        </p>
        {pharmacyName && (
          <p className="text-gray-600">
            <span className="font-medium">Farmacia:</span> {pharmacyName}
          </p>
        )}
      </div>
    </div>
  );
};
