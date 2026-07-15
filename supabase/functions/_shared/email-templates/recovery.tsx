/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Head,
  Html,
  Preview,
} from 'npm:@react-email/components@0.0.22'

interface RecoveryEmailProps {
  siteName: string
  confirmationUrl: string
}

// Plantilla canon farmapro (mismo diseño que signup.tsx)
// portada a React Email. Todo el estilo va inline (regla email HTML).
export const RecoveryEmail = ({ confirmationUrl }: RecoveryEmailProps) => (
  <Html lang="es" dir="ltr">
    <Head />
    <Preview>Restablece tu contraseña del Portal farmapro</Preview>
    <Body style={{ margin: 0, padding: 0, backgroundColor: '#f4f4f4' }}>
      <table
        role="presentation"
        cellSpacing={0}
        cellPadding={0}
        border={0}
        width="100%"
        style={{ borderCollapse: 'collapse', backgroundColor: '#f4f4f4' }}
      >
        <tbody>
          <tr>
            <td align="center" style={{ padding: '32px 12px' }}>
              <table
                role="presentation"
                cellSpacing={0}
                cellPadding={0}
                border={0}
                width={480}
                style={{
                  borderCollapse: 'collapse',
                  backgroundColor: '#ffffff',
                  maxWidth: '480px',
                  width: '100%',
                  borderRadius: '14px',
                }}
              >
                <tbody>
                  <tr>
                    <td
                      style={{
                        padding: '40px 32px',
                        fontFamily: "'Open Sans', Arial, Helvetica, sans-serif",
                        textAlign: 'center',
                      }}
                    >
                      <img
                        src="https://farmapro.es/email-logo-farmapro.png"
                        alt="farmapro"
                        width={130}
                        style={{
                          display: 'block',
                          width: '130px',
                          height: 'auto',
                          border: 0,
                          outline: 'none',
                          margin: '0 auto 28px',
                        }}
                      />

                      <h1
                        style={{
                          margin: '0 0 16px',
                          fontSize: '22px',
                          fontWeight: 800,
                          color: '#181C17',
                          lineHeight: 1.3,
                          textAlign: 'center',
                        }}
                      >
                        Restablece tu contraseña
                      </h1>

                      <p
                        style={{
                          margin: '0 0 28px',
                          fontSize: '16px',
                          lineHeight: 1.6,
                          color: '#3a3f38',
                          textAlign: 'center',
                        }}
                      >
                        Hemos recibido una solicitud para restablecer tu
                        contraseña del{' '}
                        <strong style={{ color: '#181C17' }}>Portal farmapro</strong>.
                        Haz clic en el botón para elegir una nueva.
                      </p>

                      <table
                        role="presentation"
                        cellSpacing={0}
                        cellPadding={0}
                        border={0}
                        align="center"
                        style={{ borderCollapse: 'collapse', margin: '0 auto' }}
                      >
                        <tbody>
                          <tr>
                            <td
                              align="center"
                              style={{ borderRadius: '999px', backgroundColor: '#5F8F20' }}
                            >
                              <a
                                href={confirmationUrl}
                                style={{
                                  display: 'inline-block',
                                  color: '#ffffff',
                                  textDecoration: 'none',
                                  fontSize: '15px',
                                  fontWeight: 800,
                                  letterSpacing: '0.04em',
                                  padding: '16px 40px',
                                  textTransform: 'uppercase',
                                  lineHeight: 1,
                                }}
                              >
                                Restablecer contraseña
                              </a>
                            </td>
                          </tr>
                        </tbody>
                      </table>

                      <p
                        style={{
                          margin: '32px 0 0',
                          fontSize: '13px',
                          lineHeight: 1.5,
                          color: '#9a9a9a',
                          textAlign: 'center',
                        }}
                      >
                        Si no has solicitado esto, puedes ignorar este email. Tu
                        contraseña no cambiará.
                      </p>
                    </td>
                  </tr>
                </tbody>
              </table>

              <p
                style={{
                  margin: '20px 0 0',
                  fontSize: '12px',
                  lineHeight: 1.6,
                  color: '#9a9a9a',
                  textAlign: 'center',
                  fontFamily: "'Open Sans', Arial, Helvetica, sans-serif",
                }}
              >
                farmapro · el ecosistema para farmacias
              </p>
            </td>
          </tr>
        </tbody>
      </table>
    </Body>
  </Html>
)

export default RecoveryEmail
