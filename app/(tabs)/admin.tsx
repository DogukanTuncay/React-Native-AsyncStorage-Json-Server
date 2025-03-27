import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity, FlatList, RefreshControl } from 'react-native';
import {
  Text,
  Card,
  DataTable,
  Button,
  FAB,
  Portal,
  Dialog,
  TextInput,
  useTheme,
  IconButton,
  ActivityIndicator,
  Snackbar,
  Chip,
  Avatar,
  Searchbar,
  Divider,
  Menu,
  ProgressBar,
  Surface,
  Checkbox,
  Badge,
} from 'react-native-paper';
import { router } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import { getProducts, addProduct, updateProduct, deleteProduct, Product } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import Animated, { FadeInDown, FadeOutUp } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';

// Sıralama seçenekleri
const sortOptions = [
  { label: 'Fiyat (Düşükten Yükseğe)', field: 'price', order: 'asc' },
  { label: 'Fiyat (Yüksekten Düşüğe)', field: 'price', order: 'desc' },
  { label: 'Stok (Düşükten Yükseğe)', field: 'stock', order: 'asc' },
  { label: 'Stok (Yüksekten Düşüğe)', field: 'stock', order: 'desc' },
  { label: 'İsim (A-Z)', field: 'name', order: 'asc' },
  { label: 'İsim (Z-A)', field: 'name', order: 'desc' },
] as const;

type SortOption = typeof sortOptions[number];

export default function AdminScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogVisible, setDialogVisible] = useState(false);
  const [isDeleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [isMultiDeleteDialogVisible, setMultiDeleteDialogVisible] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Partial<Product>>({});
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [page, setPage] = useState(0);
  const [numberOfItemsPerPage, setNumberOfItemsPerPage] = useState(50);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarType, setSnackbarType] = useState<'success' | 'error' | 'info'>('info');
  const [isCreating, setIsCreating] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>(sortOptions[0]);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [isSortMenuVisible, setSortMenuVisible] = useState(false);
  const [sortAnchor, setSortAnchor] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isFilterDialogVisible, setFilterDialogVisible] = useState(false);
  const [filterField, setFilterField] = useState<string>('name');
  const [filterOperator, setFilterOperator] = useState<string>('like');
  const [filterValue, setFilterValue] = useState<string>('');
  const [activeFilters, setActiveFilters] = useState<Array<{field: string, operator: string, value: string}>>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const theme = useTheme();
  const { user, isAdmin, isLoading } = useAuth();

  // Admin değilse ana sayfaya yönlendir
  useEffect(() => {
    const checkAdmin = async () => {
      if (!isLoading) {
        if (!user) {
          console.log('Admin sayfası - Kullanıcı giriş yapmamış');
          router.replace('/(auth)/login');
          return;
        }
        
        if (!isAdmin) {
          console.log('Admin sayfası - Yetkisiz erişim, kullanıcı admin değil');
          console.log('Kullanıcı:', user.email, 'Rol:', user.role);
          showSnackbar('Bu sayfaya erişim izniniz yok', 'error');
          // Hemen ana sayfaya yönlendir
          setTimeout(() => router.replace('/(tabs)'), 500);
        } else {
          console.log('Admin sayfası - Admin kullanıcısı doğrulandı');
          console.log('Admin kullanıcısı:', user.email);
        }
      }
    };
    
    checkAdmin();
  }, [isAdmin, isLoading, user]);

  // Filtreleme ve sıralama yardımcı fonksiyonu
  const filterAndSortProducts = useCallback((productsToFilter: Product[], query: string) => {
    let filtered = productsToFilter;
    
    // Arama filtresi uygula
    if (query.trim()) {
      const lowercaseQuery = query.toLowerCase();
      filtered = productsToFilter.filter(product => 
        product.name.toLowerCase().includes(lowercaseQuery) ||
        product.category.toLowerCase().includes(lowercaseQuery) ||
        product.description?.toLowerCase().includes(lowercaseQuery) ||
        product.id.toString().includes(lowercaseQuery) ||
        product.price.toString().includes(lowercaseQuery)
      );
    }
    
    // Sıralama uygula (client tarafında)
    const sortedProducts = [...filtered].sort((a, b) => {
      // ID'leri sayısal olarak karşılaştır
      if (sortBy.field === 'id') {
        return sortOrder === 'asc' 
          ? Number(a.id) - Number(b.id)
          : Number(b.id) - Number(a.id);
      }
      
      // İsim sıralaması
      if (sortBy.field === 'name') {
        const nameA = a.name?.toLowerCase() || '';
        const nameB = b.name?.toLowerCase() || '';
        return sortOrder === 'asc'
          ? nameA.localeCompare(nameB)
          : nameB.localeCompare(nameA);
      }
      
      // Fiyat sıralaması
      if (sortBy.field === 'price') {
        return sortOrder === 'asc'
          ? a.price - b.price
          : b.price - a.price;
      }
      
      // Stok sıralaması
      if (sortBy.field === 'stock') {
        return sortOrder === 'asc'
          ? a.stock - b.stock
          : b.stock - a.stock;
      }
      
      return 0;
    });
    
    console.log(`Filtrelenmiş ve sıralanmış ürünler: ${sortedProducts.length}`);
    return sortedProducts;
  }, [sortBy, sortOrder]);

  // Ürünleri getir
  const fetchProducts = useCallback(async (currentPage = 1) => {
    try {
      if (currentPage === 1) {
        setLoading(true);
      }
      
      const result = await getProducts(
        currentPage,
        numberOfItemsPerPage,
        sortBy.field,
        sortBy.order,
        activeFilters
      );
      
      if (currentPage === 1) {
        setProducts(result.products);
      } else {
        setProducts(prev => [...prev, ...result.products]);
      }
      
      setTotalItems(result.total);
      setTotalPages(Math.ceil(result.total / numberOfItemsPerPage));
    } catch (error) {
      console.error('Ürünler yüklenirken hata oluştu:', error);
    } finally {
      setLoading(false);
    }
  }, [sortBy, activeFilters, numberOfItemsPerPage]);

  // Filtreyi uygula
  const applyFilter = () => {
    if (!filterField || !filterOperator || !filterValue.trim()) {
      showSnackbar('Lütfen tüm filtre alanlarını doldurun', 'error');
      return;
    }
    
    // Yeni filtreyi ekle
    const newFilter = { field: filterField, operator: filterOperator, value: filterValue };
    setActiveFilters(prev => [...prev, newFilter]);
    
    // Filtreleme diyaloğunu kapat
    setFilterDialogVisible(false);
    
    // Filtre değerlerini sıfırla (sadece operatör ve değeri)
    setFilterValue('');
    
    // Filtre uygulandığında ilk sayfaya dön
    setPage(0);
  };
  
  // Filtreyi kaldır
  const removeFilter = (index: number) => {
    const newFilters = [...activeFilters];
    newFilters.splice(index, 1);
    setActiveFilters(newFilters);
    setPage(0);
  };
  
  // Tüm filtreleri temizle
  const clearAllFilters = () => {
    setActiveFilters([]);
    setPage(0);
  };
  
  // Aktif filtrelere göre ürünleri filtrele
  const filterProductsByActiveFilters = useCallback((products: Product[]) => {
    if (activeFilters.length === 0) {
      return products;
    }
    
    return products.filter(product => {
      // Tüm filtreler için kontrol et (AND işlemi)
      return activeFilters.every(filter => {
        const fieldValue = String(product[filter.field as keyof Product] || '').toLowerCase();
        const filterVal = String(filter.value).toLowerCase();
        
        switch (filter.operator) {
          case 'eq': // Eşittir
            return fieldValue === filterVal;
          case 'neq': // Eşit değildir
            return fieldValue !== filterVal;
          case 'gt': // Büyüktür
            return Number(fieldValue) > Number(filterVal);
          case 'lt': // Küçüktür
            return Number(fieldValue) < Number(filterVal);
          case 'gte': // Büyük veya eşittir
            return Number(fieldValue) >= Number(filterVal);
          case 'lte': // Küçük veya eşittir
            return Number(fieldValue) <= Number(filterVal);
          case 'like': // İçerir
            return fieldValue.includes(filterVal);
          case 'startsWith': // İle başlar
            return fieldValue.startsWith(filterVal);
          case 'endsWith': // İle biter
            return fieldValue.endsWith(filterVal);
          default:
            return true;
        }
      });
    });
  }, [activeFilters]);
  
  // Arama ve filtrelemeyi uygula
  const applyFilters = useCallback(() => {
    // Önce arama metni ile filtrele
    let filtered = filterAndSortProducts(products, searchQuery);
    
    // Sonra aktif filtreler ile filtrele
    filtered = filterProductsByActiveFilters(filtered);
    
    setFilteredProducts(filtered);
  }, [products, searchQuery, filterAndSortProducts, filterProductsByActiveFilters]);
  
  // Arama değiştiğinde filtrelemeyi uygula
  useEffect(() => {
    console.log(`Arama sorgusu değişti: "${searchQuery}"`);
    applyFilters();
  }, [searchQuery, applyFilters]);

  // Sıralama değiştiğinde ürünleri yeniden sırala
  useEffect(() => {
    if (products.length > 0) {
      console.log(`Sıralama değişti: ${sortBy.field} ${sortOrder}`);
      // Sayfa sıfırlansın
      setPage(0);
      // Mevcut ürünleri yeniden filtrele ve sırala
      applyFilters();
    }
  }, [sortBy, sortOrder, applyFilters]);

  // Ürün filterlarinin Alan isimlerini okunabilir hale getir
  const getReadableField = (field: string): string => {
    switch (field) {
      case 'name': return 'İsim';
      case 'category': return 'Kategori';
      case 'price': return 'Fiyat';
      case 'stock': return 'Stok';
      case 'description': return 'Açıklama';
      default: return field;
    }
  };

  // Operatör isimlerini okunabilir hale getir
  const getReadableOperator = (operator: string): string => {
    switch (operator) {
      case 'eq': return 'eşittir';
      case 'neq': return 'eşit değildir';
      case 'gt': return 'büyüktür';
      case 'lt': return 'küçüktür';
      case 'gte': return 'büyük/eşittir';
      case 'lte': return 'küçük/eşittir';
      case 'like': return 'içerir';
      case 'startsWith': return 'ile başlar';
      case 'endsWith': return 'ile biter';
      default: return operator;
    }
  };

  // Hesaplanan değerler
  const from = useMemo(() => page * numberOfItemsPerPage, [page, numberOfItemsPerPage]);
  const to = useMemo(() => Math.min((page + 1) * numberOfItemsPerPage, filteredProducts.length), [page, numberOfItemsPerPage, filteredProducts.length]);

  // useEffect içinde çağrı yapmak yerine, from ve to'yu direkt olarak useMemo ile hesaplayalım
  useEffect(() => {
    console.log(`Sayfa değişti: ${page + 1}, Aralık: ${from + 1}-${to}, Toplam: ${filteredProducts.length}`);
  }, [page, from, to, filteredProducts.length]);

  // Aktif filtreler değiştiğinde filtrelemeyi yeniden uygula
  useEffect(() => {
    if (products.length > 0) {
      applyFilters();
    }
  }, [activeFilters, applyFilters]);

  // Sayfa odaklandığında verileri yenile
  useFocusEffect(
    useCallback(() => {
      console.log('Admin sayfası odaklandı, veriler yenileniyor...');
      fetchProducts();
      setPage(0); // Sayfa odaklandığında ilk sayfayı göster
    }, [fetchProducts])
  );

  // Snackbar mesajı göster
  const showSnackbar = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setSnackbarMessage(message);
    setSnackbarType(type);
    setSnackbarVisible(true);
  };

  // Diyaloğu aç (yeni ürün veya düzenleme)
  const openProductDialog = (product?: Product) => {
    if (product) {
      setCurrentProduct({ ...product });
      setIsCreating(false);
    } else {
      setCurrentProduct({
        name: '',
        category: '',
        price: 0,
        stock: 0,
        description: '',
        imageUrl: 'https://picsum.photos/id/1/200/300', // Varsayılan resim
      });
      setIsCreating(true);
    }
    setDialogVisible(true);
  };

  // Ürün formunu gönder (ekleme veya güncelleme)
  const handleSubmitProduct = async () => {
    try {
      if (!currentProduct.name || !currentProduct.category) {
        showSnackbar('Lütfen tüm zorunlu alanları doldurun', 'error');
        return;
      }

      // ID kontrolü
      if (currentProduct.id) {
        const idNumber = parseInt(currentProduct.id.toString());
        if (isNaN(idNumber) || idNumber > 999999 || idNumber < 1) {
          showSnackbar('ID 1 ile 999999 arasında olmalıdır', 'error');
          return;
        }
      }

      setDialogVisible(false);

      if (isCreating) {
        // Yeni ürün ekle
        await addProduct(currentProduct as Omit<Product, 'id'>);
        showSnackbar('Ürün başarıyla eklendi', 'success');
      } else {
        // Ürünü güncelle
        if (currentProduct.id) {
          await updateProduct(currentProduct.id, currentProduct);
          showSnackbar('Ürün başarıyla güncellendi', 'success');
        }
      }

      // Ürün listesini yenile
      fetchProducts();
    } catch (error) {
      console.error('Ürün kaydedilirken hata oluştu:', error);
      showSnackbar('Ürün kaydedilirken hata oluştu', 'error');
    }
  };

  // Silme diyaloğunu aç
  const openDeleteDialog = (product: Product) => {
    setProductToDelete(product);
    setDeleteDialogVisible(true);
  };

  // Toplu silme diyaloğu aç
  const openMultiDeleteDialog = () => {
    if (selectedProducts.length === 0) {
      showSnackbar('Lütfen silmek istediğiniz ürünleri seçin', 'info');
      return;
    }
    setMultiDeleteDialogVisible(true);
  };

  // Ürünü sil
  const handleDeleteProduct = async () => {
    try {
      if (productToDelete) {
        setDeleteDialogVisible(false);
        await deleteProduct(productToDelete.id);
        showSnackbar('Ürün başarıyla silindi', 'success');
        fetchProducts();
      }
    } catch (error) {
      console.error('Ürün silinirken hata oluştu:', error);
      showSnackbar('Ürün silinirken hata oluştu', 'error');
    }
  };
  
  // Toplu ürün silme
  const handleMultiDeleteProducts = async () => {
    try {
      setMultiDeleteDialogVisible(false);
      
      // Seçili ürünleri sil
      const promises = selectedProducts.map(id => deleteProduct(id));
      await Promise.all(promises);
      
      showSnackbar(`${selectedProducts.length} ürün başarıyla silindi`, 'success');
      setSelectedProducts([]);
      fetchProducts();
    } catch (error) {
      console.error('Ürünler silinirken hata oluştu:', error);
      showSnackbar('Ürünler silinirken hata oluştu', 'error');
    }
  };
  
  // Sıralama değiştir
  const changeSort = (option: SortOption) => {
    setSortBy(option);
    setSortMenuVisible(false);
    setPage(1);
    setProducts([]); // Sıralama değiştiğinde ürün listesini temizle
    fetchProducts(1);
  };

  // Sıralama menüsünü göster/gizle
  const showSortMenu = () => {
    setSortMenuVisible(true);
  };

  // Sıralama menüsü render et
  const renderSortMenu = () => (
    <Portal>
      <Dialog visible={isSortMenuVisible} onDismiss={() => setSortMenuVisible(false)}>
        <Dialog.Title>Sıralama Seçenekleri</Dialog.Title>
        <Dialog.Content>
          <View>
            {sortOptions.map((option, index) => (
              <React.Fragment key={`${option.field}-${option.order}`}>
                <Menu.Item
                  title={option.label}
                  onPress={() => {
                    changeSort(option);
                    setSortMenuVisible(false);
                  }}
                  leadingIcon={sortBy.field === option.field && sortBy.order === option.order ? 'check' : undefined}
                />
                {index < sortOptions.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </View>
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={() => setSortMenuVisible(false)}>Kapat</Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );

  // Ürün seçimini değiştir
  const toggleProductSelection = (id: number) => {
    setSelectedProducts(prev => {
      if (prev.includes(id)) {
        return prev.filter(productId => productId !== id);
      } else {
        return [...prev, id];
      }
    });
  };
  
  // Tüm ürünleri seç/seçimi kaldır
  const toggleSelectAll = () => {
    if (selectedProducts.length === paginatedProducts.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(paginatedProducts.map(p => p.id));
    }
  };

  // Stok durumuna göre renk belirle
  const getStockStatusColor = (stock: number) => {
    if (stock <= 0) return theme.colors.error;
    if (stock < 10) return theme.colors.tertiary; // düşük stok için sarımsı renk
    return theme.colors.primary;
  };
  
  // Stok durumunu yüzde olarak hesapla (maksimum 100 kabul edelim)
  const getStockPercentage = (stock: number) => {
    return Math.min(stock / 100, 1);
  };

  // Mevcut sayfa için ürünleri seç
  const paginatedProducts = useMemo(() => {
    if (filteredProducts.length === 0) {
      return [];
    }
    
    // Sayfalama mantığını doğrula
    if (from >= filteredProducts.length) {
      // Eğer mevcut sayfa geçersizse, ilk sayfaya dön
      console.log('Geçersiz sayfa, ilk sayfaya dönülüyor');
      setPage(0);
      return filteredProducts.slice(0, numberOfItemsPerPage);
    }
    
    const slicedProducts = filteredProducts.slice(from, to);
    console.log(`Sayfalanmış ürünler (${from}-${to}):`, slicedProducts.length);
    return slicedProducts;
  }, [filteredProducts, from, to, numberOfItemsPerPage]);

  if (loading && products.length === 0) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <Avatar.Icon size={80} icon="shopping-outline" style={{ backgroundColor: theme.colors.primaryContainer, marginBottom: 20 }} />
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={{ marginTop: 16, fontSize: 16 }}>Yönetim paneli yükleniyor...</Text>
        <Text style={{ marginTop: 8, fontSize: 12, opacity: 0.6 }}>Lütfen bekleyin, ürünler getiriliyor</Text>
      </View>
    );
  }

  console.log(`Admin paneli render - Ürün sayısı: ${products.length}, Filtrelenmiş: ${filteredProducts.length}, Sayfalanmış: ${paginatedProducts.length}`);
  console.log('Sayfalanmış ürünler:', paginatedProducts.map(p => p.id));

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <FlatList
        data={paginatedProducts}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item: product }) => (
          <Surface 
            style={[
              styles.productCard,
              selectedProducts.includes(product.id) ? { backgroundColor: theme.colors.primaryContainer } : null
            ]}
            elevation={2}
          >
            <TouchableOpacity 
              onPress={() => toggleProductSelection(product.id)}
              activeOpacity={0.7}
            >
              <Card.Content style={styles.productCardContent}>
                {/* Üst Satır: İmaj, Başlık ve İşlemler */}
                <View style={styles.productCardTop}>
                  <View style={styles.productCardTopLeft}>
                    <Checkbox
                      status={selectedProducts.includes(product.id) ? 'checked' : 'unchecked'}
                      onPress={() => toggleProductSelection(product.id)}
                    />
                    <Avatar.Image 
                      size={50} 
                      source={{ uri: product.imageUrl }} 
                      style={styles.productCardImage}
                    />
                    <View style={styles.productCardTitleContainer}>
                      <View style={styles.productCardIdRow}>
                        <Text style={styles.productCardId}>#{product.id}</Text>
                        <Chip compact mode="flat" style={styles.categoryChip}>
                          {product.category}
                        </Chip>
                      </View>
                      <Text style={styles.productCardName}>{product.name}</Text>
                    </View>
                  </View>
                  
                  <View style={styles.productCardTopRight}>
                    <IconButton
                      icon="eye"
                      size={20}
                      mode="contained-tonal"
                      style={styles.actionIcon}
                      onPress={() => router.push({ pathname: '/product/[id]', params: { id: product.id } })}
                    />
                    <IconButton
                      icon="pencil"
                      size={20}
                      mode="contained-tonal"
                      style={styles.actionIcon}
                      onPress={(e) => {
                        e.stopPropagation();
                        openProductDialog(product);
                      }}
                    />
                    <IconButton
                      icon="delete"
                      size={20}
                      mode="contained-tonal"
                      containerColor={theme.colors.errorContainer}
                      iconColor={theme.colors.error}
                      style={styles.actionIcon}
                      onPress={(e) => {
                        e.stopPropagation();
                        openDeleteDialog(product);
                      }}
                    />
                  </View>
                </View>
                
                {/* Alt Satır: Açıklama, Fiyat ve Stok */}
                <View style={styles.productCardBottom}>
                  <View style={styles.productCardDescription}>
                    <Text numberOfLines={2} style={styles.productDescription}>
                      {product.description || 'Açıklama bulunmuyor.'}
                    </Text>
                  </View>
                  
                  <View style={styles.productCardMetrics}>
                    <View style={styles.productCardPrice}>
                      <Text style={styles.productCardLabel}>Fiyat:</Text>
                      <Text style={styles.productCardPriceValue}>
                        {product.price.toLocaleString('tr-TR')} ₺
                      </Text>
                    </View>
                    
                    <View style={styles.productCardStock}>
                      <View style={styles.stockLabelRow}>
                        <Text style={styles.productCardLabel}>Stok:</Text>
                        <Text style={[styles.productCardStockValue, { color: getStockStatusColor(product.stock) }]}>
                          {product.stock}
                        </Text>
                      </View>
                      <ProgressBar 
                        progress={getStockPercentage(product.stock)} 
                        color={getStockStatusColor(product.stock)}
                        style={styles.stockProgress}
                      />
                    </View>
                  </View>
                </View>
              </Card.Content>
            </TouchableOpacity>
          </Surface>
        )}
        contentContainerStyle={styles.productsList}
        ListHeaderComponent={
          <View>
            {/* Yönetim Paneli Başlığı */}
            <Surface style={styles.headerCard} elevation={2}>
              <Text variant="headlineSmall" style={styles.headerTitle}>Yönetim Paneli</Text>
              <Text variant="bodyMedium" style={styles.headerSubtitle}>
                Hoş geldiniz, {user?.name || 'Yönetici'}
              </Text>
            </Surface>
            
            {/* İstatistik Kartları */}
            <View style={styles.statsContainer}>
              <Surface style={styles.statCard} elevation={2}>
                <View style={styles.statIconContainer}>
                  <Avatar.Icon 
                    size={40} 
                    icon="package-variant-closed" 
                    style={{backgroundColor: theme.colors.primaryContainer}} 
                    color={theme.colors.primary}
                  />
                </View>
                <View style={styles.statContent}>
                  <Text variant="titleLarge" style={styles.statValue}>{products.length}</Text>
                  <Text variant="bodyMedium" style={styles.statLabel}>Toplam Ürün</Text>
                </View>
              </Surface>
              
              <Surface style={styles.statCard} elevation={2}>
                <View style={styles.statIconContainer}>
                  <Avatar.Icon 
                    size={40} 
                    icon="filter-variant" 
                    style={{backgroundColor: theme.colors.secondaryContainer}} 
                    color={theme.colors.secondary}
                  />
                </View>
                <View style={styles.statContent}>
                  <Text variant="titleLarge" style={styles.statValue}>{filteredProducts.length}</Text>
                  <Text variant="bodyMedium" style={styles.statLabel}>Filtrelenen</Text>
                </View>
              </Surface>
              
              <Surface style={styles.statCard} elevation={2}>
                <View style={styles.statIconContainer}>
                  <Avatar.Icon 
                    size={40} 
                    icon="checkbox-marked-outline" 
                    style={{backgroundColor: theme.colors.tertiaryContainer}} 
                    color={theme.colors.tertiary}
                  />
                </View>
                <View style={styles.statContent}>
                  <Text variant="titleLarge" style={styles.statValue}>{selectedProducts.length}</Text>
                  <Text variant="bodyMedium" style={styles.statLabel}>Seçili</Text>
                </View>
              </Surface>
            </View>

            {/* Arama ve İşlem Butonları */}
            <Surface style={styles.actionCard} elevation={1}>
              <Searchbar
                placeholder="Ürün ara..."
                onChangeText={setSearchQuery}
                value={searchQuery}
                style={styles.searchBar}
                elevation={1}
              />
              
              <View style={styles.actionButtons}>
                <Button
                  mode="contained-tonal"
                  icon="sort"
                  onPress={showSortMenu}
                  style={styles.actionButton}
                >
                  Sırala
                </Button>
                
                <Button
                  mode="contained-tonal"
                  icon="filter-variant"
                  onPress={() => setFilterDialogVisible(true)}
                  style={styles.actionButton}
                >
                  Filtrele
                </Button>
                
                <Button
                  mode="contained"
                  icon="plus"
                  onPress={() => openProductDialog()}
                  style={styles.actionButton}
                >
                  Yeni Ürün
                </Button>
                
                {selectedProducts.length > 0 && (
                  <Button
                    mode="contained-tonal"
                    icon="delete"
                    buttonColor={theme.colors.errorContainer}
                    textColor={theme.colors.error}
                    onPress={openMultiDeleteDialog}
                    style={styles.actionButton}
                  >
                    Sil ({selectedProducts.length})
                  </Button>
                )}
              </View>
              
              {/* Aktif filtreler */}
              {activeFilters.length > 0 && (
                <View style={styles.activeFiltersContainer}>
                  <View style={styles.activeFiltersHeader}>
                    <Text style={styles.activeFiltersLabel}>Aktif Filtreler:</Text>
                    <Button 
                      compact 
                      mode="text" 
                      onPress={() => {
                        setActiveFilters([]);
                        setPage(0);
                      }}
                    >
                      Tümünü Temizle
                    </Button>
                  </View>
                  
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersScrollView}>
                    <View style={styles.filtersRow}>
                      {activeFilters.map((filter, index) => (
                        <Chip
                          key={`${filter.field}-${index}`}
                          icon="filter-remove"
                          mode="outlined"
                          onClose={() => removeFilter(index)}
                          style={styles.filterChip}
                        >
                          {`${getReadableField(filter.field)} ${getReadableOperator(filter.operator)} ${filter.value}`}
                        </Chip>
                      ))}
                    </View>
                  </ScrollView>
                </View>
              )}
            </Surface>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            {loading ? (
              <>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text style={{ textAlign: 'center', marginTop: 16, opacity: 0.7 }}>
                  Ürünler yükleniyor...
                </Text>
              </>
            ) : searchQuery || activeFilters.length > 0 ? (
              <>
                <Avatar.Icon size={60} icon="magnify-close" style={{ backgroundColor: theme.colors.surfaceVariant, marginBottom: 12 }} />
                <Text style={{ textAlign: 'center', opacity: 0.7 }}>
                  Arama ve filtrelere uygun sonuç bulunamadı.
                </Text>
                <Button 
                  mode="outlined" 
                  icon="refresh"
                  onPress={() => {
                    setSearchQuery('');
                    setActiveFilters([]);
                  }}
                  style={{ marginTop: 16 }}
                >
                  Filtreleri Temizle
                </Button>
              </>
            ) : products.length === 0 ? (
              <>
                <Avatar.Icon size={60} icon="cart-outline" style={{ backgroundColor: theme.colors.surfaceVariant, marginBottom: 12 }} />
                <Text style={{ textAlign: 'center', opacity: 0.7 }}>
                  Henüz ürün bulunmuyor. Yeni ürün eklemek için "Yeni Ürün" butonunu kullanabilirsiniz.
                </Text>
                <Button 
                  mode="contained" 
                  icon="plus"
                  onPress={() => openProductDialog()}
                  style={{ marginTop: 16 }}
                >
                  Yeni Ürün Ekle
                </Button>
              </>
            ) : (
              <Text style={{ textAlign: 'center', padding: 20, opacity: 0.7 }}>
                Filtrelenmiş sonuç bulunamadı.
              </Text>
            )}
          </View>
        }
        ListFooterComponent={
          filteredProducts.length > 0 ? (
            <View style={styles.paginationContainer}>
              <Button
                mode="text"
                disabled={page === 0}
                onPress={() => setPage(Math.max(0, page - 1))}
                icon="chevron-left"
              >
                Önceki
              </Button>
              <Text style={styles.paginationText}>
                {from + 1}-{to} / {filteredProducts.length}
              </Text>
              <Button
                mode="text"
                disabled={page >= Math.ceil(filteredProducts.length / numberOfItemsPerPage) - 1}
                onPress={() => setPage(Math.min(Math.ceil(filteredProducts.length / numberOfItemsPerPage) - 1, page + 1))}
                contentStyle={{ flexDirection: 'row-reverse' }}
                icon="chevron-right"
              >
                Sonraki
              </Button>
            </View>
          ) : null
        }
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => fetchProducts(true)}
            colors={[theme.colors.primary]}
          />
        }
      />

      {/* FAB butonu */}
      <FAB
        icon="refresh"
        style={[styles.fab, { backgroundColor: theme.colors.surfaceVariant }]}
        color={theme.colors.onSurfaceVariant}
        onPress={() => fetchProducts(true)}
        loading={isRefreshing}
      />

      {/* Filtre diyaloğu */}
      <Portal>
        <Dialog visible={isFilterDialogVisible} onDismiss={() => setFilterDialogVisible(false)}>
          <Dialog.Title>Gelişmiş Filtreleme</Dialog.Title>
          <Dialog.ScrollArea style={{ maxHeight: 450 }}>
            <View style={{ padding: 16 }}>
              {/* Alan Seçimi */}
              <Text style={styles.filterSectionTitle}>Filtrelenecek Alan</Text>
              <View style={styles.filterChipsContainer}>
                {[
                  { label: 'İsim', value: 'name' },
                  { label: 'Kategori', value: 'category' },
                  { label: 'Fiyat', value: 'price' },
                  { label: 'Stok', value: 'stock' },
                  { label: 'Açıklama', value: 'description' }
                ].map(field => (
                  <Chip
                    key={field.value}
                    selected={filterField === field.value}
                    onPress={() => setFilterField(field.value)}
                    style={styles.filterOptionChip}
                    mode={filterField === field.value ? 'flat' : 'outlined'}
                  >
                    {field.label}
                  </Chip>
                ))}
              </View>
              
              {/* Operatör Seçimi */}
              <Text style={styles.filterSectionTitle}>Operatör</Text>
              <View style={styles.filterChipsContainer}>
                {[
                  { label: 'İçerir', value: 'like' },
                  { label: 'Eşittir', value: 'eq' },
                  { label: 'Eşit Değil', value: 'neq' },
                  { label: 'İle Başlar', value: 'startsWith' },
                  { label: 'İle Biter', value: 'endsWith' },
                ].map(op => (
                  <Chip
                    key={op.value}
                    selected={filterOperator === op.value}
                    onPress={() => setFilterOperator(op.value)}
                    style={styles.filterOptionChip}
                    mode={filterOperator === op.value ? 'flat' : 'outlined'}
                  >
                    {op.label}
                  </Chip>
                ))}
              </View>
              
              {/* Sayısal operatörler sadece sayısal alanlarda gösterilsin */}
              {(filterField === 'price' || filterField === 'stock') && (
                <View style={styles.filterChipsContainer}>
                  {[
                    { label: 'Büyüktür', value: 'gt' },
                    { label: 'Küçüktür', value: 'lt' },
                    { label: 'Büyük-Eşit', value: 'gte' },
                    { label: 'Küçük-Eşit', value: 'lte' },
                  ].map(op => (
                    <Chip
                      key={op.value}
                      selected={filterOperator === op.value}
                      onPress={() => setFilterOperator(op.value)}
                      style={styles.filterOptionChip}
                      mode={filterOperator === op.value ? 'flat' : 'outlined'}
                    >
                      {op.label}
                    </Chip>
                  ))}
                </View>
              )}
              
              {/* Değer Girişi */}
              <Text style={styles.filterSectionTitle}>Değer</Text>
              <TextInput
                mode="outlined"
                value={filterValue}
                onChangeText={setFilterValue}
                placeholder={`Aranacak değeri girin...`}
                keyboardType={(filterField === 'price' || filterField === 'stock') ? 'numeric' : 'default'}
                style={{ marginBottom: 16 }}
              />
              
              {/* Hızlı Filtre Önerileri */}
              {filterField === 'category' && (
                <View style={styles.quickFiltersContainer}>
                  <Text style={[styles.filterSectionTitle, { marginBottom: 8 }]}>Hızlı Kategori Seçimleri</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={styles.quickFiltersRow}>
                      {['Elektronik', 'Giyim', 'Aksesuar', 'Kitap', 'Mobilya'].map(category => (
                        <Chip
                          key={category}
                          onPress={() => setFilterValue(category)}
                          style={{ marginRight: 8, marginBottom: 8 }}
                        >
                          {category}
                        </Chip>
                      ))}
                    </View>
                  </ScrollView>
                </View>
              )}
              
              {/* Aktif filtreler */}
              {activeFilters.length > 0 && (
                <View style={{ marginTop: 16 }}>
                  <Text style={styles.filterSectionTitle}>Aktif Filtreler</Text>
                  <View style={{ marginTop: 8 }}>
                    {activeFilters.map((filter, index) => (
                      <Chip
                        key={index}
                        icon="filter-remove"
                        onClose={() => removeFilter(index)}
                        style={{ marginRight: 8, marginBottom: 8 }}
                      >
                        {`${getReadableField(filter.field)} ${getReadableOperator(filter.operator)} ${filter.value}`}
                      </Chip>
                    ))}
                  </View>
                </View>
              )}
            </View>
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <Button onPress={() => setFilterDialogVisible(false)}>İptal</Button>
            <Button mode="contained" onPress={applyFilter}>Filtreyi Uygula</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Ürün ekleme/düzenleme diyaloğu */}
      <Portal>
        <Dialog visible={isDialogVisible} onDismiss={() => setDialogVisible(false)}>
          <Dialog.Title>
            {isCreating ? 'Yeni Ürün Ekle' : 'Ürünü Düzenle'}
          </Dialog.Title>
          <Dialog.ScrollArea style={styles.dialogScrollArea}>
            <View style={styles.dialogContent}>
              <TextInput
                label="ID"
                value={currentProduct.id?.toString() || ''}
                onChangeText={(text) => {
                  // Sadece sayıları kabul et ve maksimum 6 haneli olmasını sağla
                  const numericValue = text.replace(/[^0-9]/g, '').slice(0, 6);
                  setCurrentProduct(prev => ({ 
                    ...prev, 
                    id: numericValue || undefined 
                  }));
                }}
                keyboardType="numeric"
                maxLength={6}
                style={styles.input}
                mode="outlined"
              />
              <Text style={styles.helperText}>1-999999 arası bir sayı girin</Text>
              <TextInput
                label="Ürün Adı *"
                value={currentProduct.name?.toString() || ''}
                onChangeText={(text) => setCurrentProduct({ ...currentProduct, name: text })}
                mode="outlined"
                style={styles.input}
              />
              <TextInput
                label="Kategori *"
                value={currentProduct.category?.toString() || ''}
                onChangeText={(text) => setCurrentProduct({ ...currentProduct, category: text })}
                mode="outlined"
                style={styles.input}
              />
              <View style={styles.rowInputs}>
                <TextInput
                  label="Fiyat *"
                  value={currentProduct.price?.toString() || ''}
                  onChangeText={(text) => setCurrentProduct({ ...currentProduct, price: parseFloat(text) || 0 })}
                  mode="outlined"
                  keyboardType="numeric"
                  style={[styles.input, { flex: 1, marginRight: 8 }]}
                  right={<TextInput.Affix text="₺" />}
                />
                <TextInput
                  label="Stok *"
                  value={currentProduct.stock?.toString() || ''}
                  onChangeText={(text) => setCurrentProduct({ ...currentProduct, stock: parseInt(text) || 0 })}
                  mode="outlined"
                  keyboardType="numeric"
                  style={[styles.input, { flex: 1 }]}
                />
              </View>
              <TextInput
                label="Açıklama"
                value={currentProduct.description?.toString() || ''}
                onChangeText={(text) => setCurrentProduct({ ...currentProduct, description: text })}
                mode="outlined"
                multiline
                numberOfLines={3}
                style={styles.input}
              />
              <TextInput
                label="Resim URL"
                value={currentProduct.imageUrl?.toString() || ''}
                onChangeText={(text) => setCurrentProduct({ ...currentProduct, imageUrl: text })}
                mode="outlined"
                style={styles.input}
              />
              {currentProduct.imageUrl && (
                <View style={styles.imagePreviewContainer}>
                  <Text style={styles.imagePreviewLabel}>Görsel Önizleme:</Text>
                  <Avatar.Image 
                    size={80} 
                    source={{ uri: currentProduct.imageUrl }} 
                    style={styles.imagePreview}
                  />
                </View>
              )}
            </View>
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <Button onPress={() => setDialogVisible(false)}>İptal</Button>
            <Button mode="contained" onPress={handleSubmitProduct}>Kaydet</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Silme onay diyaloğu */}
      <Portal>
        <Dialog visible={isDeleteDialogVisible} onDismiss={() => setDeleteDialogVisible(false)}>
          <Dialog.Icon icon="alert" />
          <Dialog.Title>Ürünü Sil</Dialog.Title>
          <Dialog.Content>
            <Text>
              "{productToDelete?.name}" ürününü silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDeleteDialogVisible(false)}>İptal</Button>
            <Button 
              mode="contained-tonal"
              buttonColor={theme.colors.errorContainer}
              textColor={theme.colors.error}
              onPress={handleDeleteProduct}
            >
              Sil
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Toplu silme onay diyaloğu */}
      <Portal>
        <Dialog visible={isMultiDeleteDialogVisible} onDismiss={() => setMultiDeleteDialogVisible(false)}>
          <Dialog.Icon icon="alert" />
          <Dialog.Title>Toplu Ürün Silme</Dialog.Title>
          <Dialog.Content>
            <Text>
              Seçili {selectedProducts.length} ürünü silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setMultiDeleteDialogVisible(false)}>İptal</Button>
            <Button 
              mode="contained-tonal"
              buttonColor={theme.colors.errorContainer}
              textColor={theme.colors.error}
              onPress={handleMultiDeleteProducts}
            >
              {selectedProducts.length} Ürünü Sil
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Bildirim çubuğu */}
      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
        style={[
          styles.snackbar,
          snackbarType === 'success' ? styles.successSnackbar : 
          snackbarType === 'error' ? styles.errorSnackbar : 
          styles.infoSnackbar
        ]}
        action={{
          label: 'Tamam',
          onPress: () => setSnackbarVisible(false),
        }}
      >
        {snackbarMessage}
      </Snackbar>

      {/* Sıralama menüsü */}
      {renderSortMenu()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  headerCard: {
    padding: 16,
    marginBottom: 12,
    borderRadius: 8,
  },
  headerTitle: {
    marginBottom: 8,
  },
  headerSubtitle: {
    opacity: 0.7,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    overflow: 'hidden',
    elevation: 2,
  },
  statIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statContent: {
    alignItems: 'center',
  },
  statValue: {
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    opacity: 0.7,
  },
  actionCard: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  searchContainer: {
    marginBottom: 12,
  },
  searchBar: {
    marginBottom: 12,
    borderRadius: 8,
    height: 48,
  },
  actionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  actionButton: {
    marginRight: 8,
    marginBottom: 8,
  },
  productCard: {
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
  },
  productCardContent: {
    padding: 16,
  },
  productCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  productCardTopLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  productCardTopRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  productCardTitleContainer: {
    flex: 1,
    marginLeft: 10,
  },
  productCardIdRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  productCardId: {
    fontWeight: 'bold',
    fontSize: 14,
    opacity: 0.6,
  },
  productCardName: {
    fontWeight: 'bold',
    fontSize: 16,
    marginTop: 2,
  },
  productCardImage: {
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  productCardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(0,0,0,0.01)',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  productCardDescription: {
    flex: 1,
    marginRight: 16,
  },
  productDescription: {
    fontSize: 13,
    opacity: 0.8,
  },
  productCardMetrics: {
    width: 150,
  },
  productCardPrice: {
    marginBottom: 12,
  },
  productCardStock: {
  },
  stockLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  productCardLabel: {
    fontSize: 12,
    opacity: 0.7,
  },
  productCardPriceValue: {
    fontWeight: 'bold',
    fontSize: 18,
  },
  productCardStockValue: {
    fontWeight: 'bold',
  },
  categoryChip: {
    height: 24,
    marginLeft: 8,
  },
  actionIcon: {
    margin: 4,
  },
  stockProgress: {
    height: 4,
    borderRadius: 2,
  },
  productsList: {
    padding: 8,
    paddingBottom: 80, // FAB için alan bırak
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.01)',
    borderRadius: 8,
    margin: 16,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(0,0,0,0.02)',
    borderRadius: 8,
    marginVertical: 8,
  },
  paginationText: {
    fontWeight: 'bold',
  },
  productSeparator: {
    height: 12,
  },
  activeFiltersContainer: {
    marginTop: 8,
  },
  activeFiltersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  activeFiltersLabel: {
    fontWeight: 'bold',
  },
  filtersScrollView: {
    maxHeight: 200,
  },
  filtersRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterChip: {
    marginRight: 8,
    marginBottom: 8,
  },
  filterSectionTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  filterChipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  filterOptionChip: {
    marginRight: 8,
    marginBottom: 8,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
  snackbar: {
    bottom: 16,
    elevation: 4,
  },
  successSnackbar: {
    backgroundColor: 'rgba(76, 175, 80, 0.9)',
  },
  errorSnackbar: {
    backgroundColor: 'rgba(244, 67, 54, 0.9)',
  },
  infoSnackbar: {
    backgroundColor: 'rgba(33, 150, 243, 0.9)',
  },
  dialogScrollArea: {
    maxHeight: 400,
  },
  dialogContent: {
    paddingVertical: 8,
  },
  input: {
    marginBottom: 16,
  },
  rowInputs: {
    flexDirection: 'row',
  },
  imagePreviewContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  imagePreviewLabel: {
    marginRight: 16,
  },
  imagePreview: {
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  quickFiltersContainer: {
    marginBottom: 16,
  },
  quickFiltersRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  helperText: {
    fontSize: 12,
    opacity: 0.7,
  },
}); 