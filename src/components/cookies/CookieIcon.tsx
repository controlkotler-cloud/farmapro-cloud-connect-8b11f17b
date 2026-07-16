export const CookieIcon = () => {
  const handleClick = () => {
    window.dispatchEvent(new CustomEvent('open-cookie-settings'));
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="text-xs text-muted-foreground hover:text-foreground transition-colors"
    >
      Configuración de cookies
    </button>
  );
};
