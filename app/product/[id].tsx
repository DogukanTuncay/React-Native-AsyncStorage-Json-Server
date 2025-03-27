import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Image } from 'react-native';
import { Text, Card, Chip, ActivityIndicator, Button, useTheme, IconButton } from 'react-native-paper';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { getProduct, Product } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const theme = useTheme();
  const { isAdmin } = useAuth();

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const productId = typeof id === 'string' ? parseInt(id, 10) : Array.isArray(id) ? parseInt(id[0], 10) : 0;
        console.log('Ürün detayı getiriliyor, ID:', productId);
        
        if (productId > 0) {
          const data = await getProduct(productId);
          setProduct(data);
        } else {
          setError('Geçersiz ürün ID\'si');
        }
      } catch (err) {
        console.error('Ürün getirme hatası:', err);
        setError('Ürün bilgileri alınamadı');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={{ marginTop: 20 }}>Ürün yükleniyor...</Text>
      </View>
    );
  }

  if (error || !product) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error || 'Ürün bulunamadı'}</Text>
        <Button mode="contained" onPress={() => router.back()}>
          Geri Dön
        </Button>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: product.name,
          headerRight: () => isAdmin ? (
            <IconButton
              icon="pencil"
              onPress={() => router.push('/(tabs)/admin')}
            />
          ) : null
        }}
      />
      <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.imageContainer}>
          <Image source={{ uri: product.imageUrl }} style={styles.productImage} />
        </View>

        <Card style={styles.infoCard}>
          <Card.Content>
            <Text variant="headlineMedium" style={styles.productName}>{product.name}</Text>
            <Text variant="headlineSmall" style={styles.productPrice}>
              {product.price.toLocaleString('tr-TR')} ₺
            </Text>

            <View style={styles.chipContainer}>
              <Chip icon="tag" style={styles.chip}>{product.category}</Chip>
              <Chip 
                icon="package" 
                style={styles.chip}
                mode={product.stock > 0 ? 'flat' : 'outlined'}
                textStyle={{ color: product.stock > 0 ? theme.colors.onSurface : theme.colors.error }}
              >
                {product.stock > 0 ? `Stok: ${product.stock}` : 'Stokta Yok'}
              </Chip>
            </View>

            <View style={styles.divider} />

            <Text variant="titleMedium" style={styles.sectionTitle}>Ürün Açıklaması</Text>
            <Text variant="bodyLarge" style={styles.description}>
              {product.description}
            </Text>

            <View style={styles.divider} />

            <Text variant="titleMedium" style={styles.sectionTitle}>Ürün Bilgileri</Text>
            <View style={styles.infoRow}>
              <Text variant="bodyMedium" style={styles.infoLabel}>Ürün Kodu:</Text>
              <Text variant="bodyMedium">{product.id}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text variant="bodyMedium" style={styles.infoLabel}>Kategori:</Text>
              <Text variant="bodyMedium">{product.category}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text variant="bodyMedium" style={styles.infoLabel}>Stok Durumu:</Text>
              <Text 
                variant="bodyMedium"
                style={{ color: product.stock > 0 ? theme.colors.primary : theme.colors.error }}
              >
                {product.stock > 0 ? `${product.stock} adet` : 'Stokta Yok'}
              </Text>
            </View>
          </Card.Content>
        </Card>

        <Card style={styles.actionsCard}>
          <Card.Content>
            <Button
              mode="contained"
              style={styles.actionButton}
              disabled={product.stock <= 0}
              icon="cart"
            >
              {product.stock > 0 ? 'Sepete Ekle' : 'Stokta Yok'}
            </Button>

            <Button
              mode="outlined"
              style={styles.actionButton}
              icon="arrow-left"
              onPress={() => router.back()}
            >
              Geri Dön
            </Button>
          </Card.Content>
        </Card>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    marginBottom: 20,
    textAlign: 'center',
  },
  imageContainer: {
    width: '100%',
    height: 300,
    overflow: 'hidden',
  },
  productImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  infoCard: {
    margin: 16,
    elevation: 4,
  },
  productName: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  productPrice: {
    marginBottom: 16,
    fontWeight: 'bold',
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginVertical: 8,
  },
  chip: {
    marginRight: 8,
    marginBottom: 8,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    marginVertical: 16,
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  description: {
    lineHeight: 24,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  infoLabel: {
    fontWeight: 'bold',
    marginRight: 8,
    width: 100,
  },
  actionsCard: {
    margin: 16,
    marginTop: 0,
    elevation: 4,
    marginBottom: 30,
  },
  actionButton: {
    marginVertical: 8,
  },
}); 