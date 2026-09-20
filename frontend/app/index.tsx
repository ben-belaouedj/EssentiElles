import { Redirect } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../src/store/authStore';
import { Gradients } from '../src/constants/theme';
import LoadingSpinner from '../src/components/ui/LoadingSpinner';

export default function Index() {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <LinearGradient colors={Gradients.blush} style={styles.loader}>
        <LoadingSpinner fullScreen />
      </LinearGradient>
    );
  }

  if (isAuthenticated) {
    return <Redirect href="/(main)/(home)/home" />;
  }

  return <Redirect href="/(auth)/splash" />;
}

const styles = StyleSheet.create({
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
