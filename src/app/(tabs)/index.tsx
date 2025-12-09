import { ActivityIndicator } from "react-native-paper";
import { useTheme } from "styled-components/native";

import {
  Badge,
  BadgeText,
  BodyText,
  Card,
  CenterContainer,
  PaddedContainer,
  Row,
  Spacer,
  Title,
} from "@/components/styled";
import { useAuth } from "@/context/AuthContext";

export default function TabOneScreen() {
  const { user, initializing } = useAuth();
  const theme = useTheme();

  if (initializing) {
    return (
      <CenterContainer>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </CenterContainer>
    );
  }

  return (
    <PaddedContainer>
      <Card elevated>
        <Row justify="space-between" align="center">
          <Title color={theme.colors.primary}>Zona Pits</Title>
          <Badge variant="secondary">
            <BadgeText>Premium</BadgeText>
          </Badge>
        </Row>
        <BodyText>
          {user
            ? `Bienvenido de nuevo, ${user.name || user.email}!`
            : "Aún no hay sesión activa."}
        </BodyText>
        <Spacer size="sm" />
        <BodyText color={theme.colors.textSecondary}>
          Aquí podrás explorar vehículos de lujo, gestionar tu garaje y
          descubrir nuevas oportunidades exclusivas.
        </BodyText>
      </Card>
    </PaddedContainer>
  );
}
