import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";

export type PasswordRecoveryEmailProps = {
  fullName: string;
  provisionalKey: string;
  expiresInMinutes: number;
  appUrl: string;
};

/**
 * Email P1 con la clave provisoria de recuperación.
 * Diseño minimalista que reusa los tokens visuales de Reservibes:
 * fondo hueso, acento naranja, tipografía pesada en títulos.
 */
export function PasswordRecoveryEmail({
  fullName,
  provisionalKey,
  expiresInMinutes,
  appUrl,
}: PasswordRecoveryEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Tu clave provisoria para recuperar tu contraseña</Preview>
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          <Text style={brandStyle}>RESERVIBES</Text>

          <Heading style={headingStyle}>Recuperar contraseña</Heading>

          <Text style={paragraphStyle}>Hola {fullName || "👋"},</Text>

          <Text style={paragraphStyle}>
            Recibimos un pedido para restablecer tu contraseña. Tu clave
            provisoria es:
          </Text>

          <Section style={keyBoxStyle}>
            <Text style={keyStyle}>{provisionalKey}</Text>
          </Section>

          <Text style={paragraphStyle}>
            Ingresá con esta clave en la pantalla de inicio de sesión. Se te va
            a pedir que definas una nueva contraseña antes de continuar.
          </Text>

          <Section style={{ textAlign: "center", margin: "32px 0" }}>
            <Button href={`${appUrl}/admin`} style={buttonStyle}>
              Ir a ingresar
            </Button>
          </Section>

          <Hr style={hrStyle} />

          <Text style={smallStyle}>
            Esta clave vence en {expiresInMinutes} minutos y solo puede usarse
            una vez. Si no fuiste vos, ignorá este mensaje — tu contraseña
            sigue siendo la misma.
          </Text>

          <Text style={smallStyle}>
            Por seguridad, nunca compartas esta clave con nadie.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

// -----------------------------------------------------------------------------
// Estilos inline (React Email usa estilos inline, no clases)
// -----------------------------------------------------------------------------

const bodyStyle: React.CSSProperties = {
  backgroundColor: "#F5F3F0",
  fontFamily:
    "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  margin: 0,
  padding: "40px 0",
};

const containerStyle: React.CSSProperties = {
  backgroundColor: "#FFFFFF",
  border: "1px solid #D9D4CE",
  borderRadius: "14px",
  maxWidth: "560px",
  margin: "0 auto",
  padding: "40px",
};

const brandStyle: React.CSSProperties = {
  fontSize: "14px",
  fontWeight: 900,
  letterSpacing: "0.1em",
  color: "#0F0E0D",
  margin: "0 0 24px 0",
};

const headingStyle: React.CSSProperties = {
  fontSize: "28px",
  fontWeight: 900,
  color: "#0F0E0D",
  margin: "0 0 16px 0",
  lineHeight: 1.15,
};

const paragraphStyle: React.CSSProperties = {
  fontSize: "16px",
  lineHeight: 1.6,
  color: "#0F0E0D",
  margin: "0 0 16px 0",
};

const keyBoxStyle: React.CSSProperties = {
  backgroundColor: "#F5F3F0",
  border: "1px solid #D9D4CE",
  borderRadius: "10px",
  padding: "20px",
  margin: "20px 0",
  textAlign: "center",
};

const keyStyle: React.CSSProperties = {
  fontFamily:
    "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
  fontSize: "28px",
  fontWeight: 700,
  letterSpacing: "0.15em",
  color: "#0F0E0D",
  margin: 0,
};

const buttonStyle: React.CSSProperties = {
  backgroundColor: "#FF4D2E",
  color: "#FFFFFF",
  fontSize: "16px",
  fontWeight: 600,
  padding: "14px 28px",
  borderRadius: "10px",
  textDecoration: "none",
  display: "inline-block",
};

const hrStyle: React.CSSProperties = {
  borderColor: "#D9D4CE",
  margin: "32px 0 20px 0",
};

const smallStyle: React.CSSProperties = {
  fontSize: "13px",
  lineHeight: 1.55,
  color: "#6B6560",
  margin: "0 0 12px 0",
};