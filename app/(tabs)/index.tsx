import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, ActivityIndicator, ScrollView, TextInput } from 'react-native';
import {
  Text,
  Searchbar,
  Card,
  Button,
  Chip,
  useTheme,
  Menu,
  Divider,
  IconButton,
  Dialog,
  Portal,
} from 'react-native-paper';
import { router } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import { getProducts, Product, Filter } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

// Filtreleme seçenekleri
const filterOperators = [
  { label: 'Eşittir', value: 'eq' },
  { label: 'Eşit Değildir', value: 'neq' },
  { label: 'Büyüktür', value: 'gt' },
  { label: 'Küçüktür', value: 'lt' },
  { label: 'Büyük veya Eşittir', value: 'gte' },
  { label: 'Küçük veya Eşittir', value: 'lte' },
  { label: 'İçerir', value: 'like' },
];

// Sıralama seçenekleri
const sortOptions = [
  { label: 'En Yeni', field: 'createdAt', order: 'desc' },
  { label: 'En Eski', field: 'createdAt', order: 'asc' },
  { label: 'Fiyat (Düşükten Yükseğe)', field: 'price', order: 'asc' },
  { label: 'Fiyat (Yüksekten Düşüğe)', field: 'price', order: 'desc' },
  { label: 'Stok (Düşükten Yükseğe)', field: 'stock', order: 'asc' },
  { label: 'Stok (Yüksekten Düşüğe)', field: 'stock', order: 'desc' },
  { label: 'İsim (A-Z)', field: 'name', order: 'asc' },
  { label: 'İsim (Z-A)', field: 'name', order: 'desc' },
];

export default function ProductsScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState<Filter[]>([]);
  const [sortBy, setSortBy] = useState(sortOptions[0]);
  const [isSortMenuVisible, setSortMenuVisible] = useState(false);
  const [isFilterDialogVisible, setFilterDialogVisible] = useState(false);
  const [isAdvancedFilterVisible, setAdvancedFilterVisible] = useState(false);
  const [filterField, setFilterField] = useState<string>('name');
  const [filterOperator, setFilterOperator] = useState<string>('like');
  const [filterValue, setFilterValue] = useState<string>('');
  
  const theme = useTheme();
  const { user } = useAuth();
  
  const ITEMS_PER_PAGE = 8;

  // Ürünleri getir
  const fetchProducts = useCallback(async (currentPage = 1, refresh = false) => {
    try {
      if (refresh) {
        setRefreshing(true);
      } else if (!refresh && currentPage === 1) {
        setLoading(true);
      }
      
      // Arama yaparken isim filtrelemesi ekle
      let currentFilters = [...filters];
      if (search) {
        // Arama filtresi varsa güncelle, yoksa ekle
        const searchFilterIndex = currentFilters.findIndex(
          f => f.field === 'name' && f.operator === 'like'
        );
        
        if (searchFilterIndex >= 0) {
          currentFilters[searchFilterIndex] = { field: 'name', operator: 'like', value: search };
        } else {
          currentFilters.push({ field: 'name', operator: 'like', value: search });
        }
      }
      
      console.log('Filtreler:', currentFilters);
      
      const result = await getProducts(
        currentPage,
        ITEMS_PER_PAGE,
        sortBy.field,
        sortBy.order,
        currentFilters
      );
      
      if (currentPage === 1 || refresh) {
        setProducts(result.products);
      } else {
        setProducts(prev => [...prev, ...result.products]);
      }
      
      setTotalItems(result.total);
      setTotalPages(Math.ceil(result.total / ITEMS_PER_PAGE));
    } catch (error) {
      console.error('Ürünler yüklenirken hata oluştu:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search, filters, sortBy, ITEMS_PER_PAGE]);
  
  // Sayfa değiştiğinde yeni sayfayı yükle, ama kaydırma yapma
  useEffect(() => {
    if (page > 1) {
      console.log(`Sayfa değişti: ${page}, ürünler yükleniyor`);
      fetchProducts(page);
    }
  }, [page, fetchProducts]);

  // Sayfa yüklendiğinde ve odaklandığında ürünleri getir
  useFocusEffect(
    useCallback(() => {
      console.log('Sayfa odaklandı, ürünler yeniden yükleniyor...');
      // İlk yüklemede sayfa 1'e dön ve ürünleri temizle
      setPage(1);
      setProducts([]);
      fetchProducts(1);
    }, [fetchProducts])
  );

  // Yenileme işlemi
  const handleRefresh = () => {
    console.log('Sayfa yenileniyor...');
    setPage(1);
    setProducts([]); // Yenileme sırasında ürünleri temizle
    fetchProducts(1, true);
  };

  // Daha fazla ürün yükleme - sonsuz kaydırma için
  const handleLoadMore = () => {
    if (page < totalPages && !loading && !refreshing) {
      const nextPage = page + 1;
      console.log(`Daha fazla ürün yükleniyor. Sayfa ${nextPage}/${totalPages}`);
      setPage(nextPage);
      // fetchProducts burada çağrılmıyor, useEffect içinde page değiştiğinde çağrılacak
    } else {
      console.log(`Sayfa yükleme atlanıyor. Mevcut sayfa: ${page}/${totalPages}, Yükleniyor: ${loading}, Yenileniyor: ${refreshing}`);
    }
  };

  // Arama işlemi
  const handleSearch = async () => {
    if (!search.trim()) return;
    
    setLoading(true);
    try {
      // Arama için özel bir filtre oluştur
      const searchFilter: Filter = {
        field: 'name',
        operator: 'like',
        value: search
      };
      
      // Mevcut filtreleri koru ve arama filtresini ekle
      const currentFilters = [...filters, searchFilter];
      
      // Sayfa 1'e dön ve ürünleri getir
      setPage(1);
      const result = await getProducts(1, ITEMS_PER_PAGE, sortBy.field, sortBy.order, currentFilters);
      
      setProducts(result.products);
      setTotalItems(result.total);
      setTotalPages(Math.ceil(result.total / ITEMS_PER_PAGE));
    } catch (error) {
      console.error('Arama yapılırken hata oluştu:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filtre ekle
  const addFilter = (filter: Filter) => {
    console.log('Filtre ekleniyor:', filter);
    setFilters(prev => [...prev, filter]);
    setFilterDialogVisible(false);
    setPage(1);
    fetchProducts(1);
  };

  // Filtre kaldır
  const removeFilter = (index: number) => {
    console.log('Filtre kaldırılıyor:', filters[index]);
    const newFilters = [...filters];
    newFilters.splice(index, 1);
    setFilters(newFilters);
    setPage(1);
    fetchProducts(1);
  };

  // Sıralama menüsünü göster/gizle
  const showSortMenu = () => {
    setSortMenuVisible(true);
  };

  // Sıralama değiştir
  const changeSort = (option: typeof sortOptions[0]) => {
    setSortBy(option);
    setSortMenuVisible(false);
    setPage(1);
    setProducts([]); // Sıralama değiştiğinde ürün listesini temizle
    fetchProducts(1);
  };

  // Gelişmiş filtreleme
  const addAdvancedFilter = () => {
    if (!filterField || !filterOperator || !filterValue.trim()) {
      showSnackbar('Lütfen tüm filtre alanlarını doldurun', 'error');
      return;
    }

    // Sayısal değerleri dönüştür
    let parsedValue = filterValue;
    if (filterField === 'price' || filterField === 'stock') {
      parsedValue = parseFloat(filterValue).toString();
    }

    // Yeni filtreyi ekle
    const newFilter = {
      field: filterField,
      operator: filterOperator as 'like' | 'eq' | 'neq' | 'gt' | 'lt' | 'gte' | 'lte',
      value: parsedValue
    };

    // Aynı alan için mevcut filtreyi güncelle veya yeni filtre ekle
    setFilters(prev => {
      const existingFilterIndex = prev.findIndex(
        f => f.field === filterField && f.operator === filterOperator
      );
      
      if (existingFilterIndex >= 0) {
        const updatedFilters = [...prev];
        updatedFilters[existingFilterIndex] = newFilter;
        return updatedFilters;
      }
      
      return [...prev, newFilter];
    });

    setFilterValue('');
    setAdvancedFilterVisible(false);
    setPage(1);
    fetchProducts(1);
  };

  // Filtre diyaloğu render et
  const renderFilterDialog = () => (
    <Portal>
      <Dialog visible={isFilterDialogVisible} onDismiss={() => setFilterDialogVisible(false)}>
        <Dialog.Title>Özel Filtre Ekle</Dialog.Title>
        <Dialog.Content>
          <Text style={{ marginBottom: 16 }}>Eklemek istediğiniz filtreyi seçin:</Text>
          
          <View style={{ marginBottom: 16 }}>
            <Button
              mode="outlined"
              icon="tag"
              onPress={() => {
                addFilter({ field: 'category', operator: 'eq', value: 'Elektronik' });
              }}
              style={{ marginVertical: 4 }}
            >
              Elektronik Ürünler
            </Button>
            
            <Button
              mode="outlined"
              icon="cash"
              onPress={() => {
                addFilter({ field: 'price', operator: 'lt', value: 1000 });
              }}
              style={{ marginVertical: 4 }}
            >
              1000₺ Altı Ürünler
            </Button>
            
            <Button
              mode="outlined"
              icon="cash-multiple"
              onPress={() => {
                addFilter({ field: 'price', operator: 'gt', value: 1000 });
              }}
              style={{ marginVertical: 4 }}
            >
              1000₺ Üstü Ürünler
            </Button>
            
            <Button
              mode="outlined"
              icon="archive"
              onPress={() => {
                addFilter({ field: 'stock', operator: 'gt', value: 0 });
              }}
              style={{ marginVertical: 4 }}
            >
              Stokta Olanlar
            </Button>
          </View>
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={() => setFilterDialogVisible(false)}>Kapat</Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );

  // Ürün kartını render et
  const renderProductCard = ({ item }: { item: Product }) => (
    <Card
      style={styles.productCard}
      onPress={() => router.push({ pathname: '/product/[id]', params: { id: item.id } })}
    >
      <Card.Cover source={{ uri: item.imageUrl }} style={styles.productImage} />
      
      <Card.Content style={styles.productCardContent}>
        <View style={styles.productHeader}>
          <Text style={styles.productCategory}>{item.category}</Text>
          <Text style={styles.productId}>#{item.id}</Text>
        </View>
        
        <Text style={styles.productName} numberOfLines={1} ellipsizeMode="tail">{item.name}</Text>
        
        <Text numberOfLines={2} style={styles.productDescription}>
          {item.description}
        </Text>
        
        <View style={styles.productFooter}>
          <Text style={styles.productPrice}>{item.price.toLocaleString('tr-TR')} ₺</Text>
          <View style={styles.stockContainer}>
            <Text 
              style={[
                styles.stockText, 
                { color: item.stock > 0 ? theme.colors.primary : theme.colors.error }
              ]}
            >
              {item.stock > 0 ? `${item.stock} adet` : 'Stokta yok'}
            </Text>
          </View>
        </View>
      </Card.Content>
      
      <Card.Actions style={styles.cardActions}>
        <Button 
          mode="contained" 
          icon="eye"
          style={styles.detailButton}
          onPress={() => router.push({ pathname: '/product/[id]', params: { id: item.id } })}
        >
          Ürün Detayı
        </Button>
      </Card.Actions>
    </Card>
  );

  // Operatör sembollerini okunabilir hale getir
  const getReadableOperator = (operator: string) => {
    const operators: { [key: string]: string } = {
      'eq': '=',
      'neq': '≠',
      'gt': '>',
      'lt': '<',
      'gte': '≥',
      'lte': '≤',
      'like': 'içerir',
      'startsWith': 'ile başlar',
      'endsWith': 'ile biter'
    };
    return operators[operator] || operator;
  };

  // Bildirim göster
  const showSnackbar = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    // Snackbar implementasyonu
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <FlatList
        data={products}
        renderItem={renderProductCard}
        keyExtractor={(item) => `${item.id}-${sortBy.field}-${sortBy.order}`}
        contentContainerStyle={styles.productList}
        numColumns={2}
        columnWrapperStyle={styles.productRow}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.1}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[theme.colors.primary]}
          />
        }
        ListHeaderComponent={
          <View style={styles.listHeader}>
            {/* Arama çubuğu */}
            <View style={styles.searchContainer}>
              <Searchbar
                placeholder="Ürün ara..."
                onChangeText={setSearch}
                value={search}
                onSubmitEditing={handleSearch}
                style={styles.searchBar}
              />
              
              <View style={styles.filterContainer}>
                <Chip 
                  mode="outlined" 
                  icon="sort"
                  onPress={() => setSortMenuVisible(true)}
                  style={styles.filterChip}
                  compact
                >
                  {sortBy.label}
                </Chip>
                
                <Chip
                  mode="outlined"
                  icon="filter-variant-plus"
                  onPress={() => setFilterDialogVisible(true)}
                  style={styles.filterChip}
                  compact
                >
                  Filtrele
                </Chip>
                
                <Chip 
                  mode="outlined" 
                  icon="filter-variant"
                  onPress={() => setAdvancedFilterVisible(true)}
                  style={styles.filterChip}
                  compact
                >
                  Gelişmiş
                </Chip>
              </View>
              
              {/* Aktif filtreler */}
              {filters.length > 0 && (
                <View style={styles.activeFiltersContainer}>
                  <View style={styles.filterHeaderRow}>
                    <Text style={styles.activeFiltersLabel}>Aktif Filtreler:</Text>
                    <Button 
                      compact 
                      mode="text" 
                      onPress={() => {
                        setFilters([]);
                        setPage(1);
                        fetchProducts(1);
                      }}
                    >
                      Temizle
                    </Button>
                  </View>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={styles.activeFilterChips}>
                      {filters.map((filter, index) => (
                        <Chip
                          key={`${filter.field}-${index}`}
                          icon="filter-remove"
                          mode="flat"
                          onClose={() => removeFilter(index)}
                          style={styles.activeFilterChip}
                          compact
                        >
                          {`${getReadableField(filter.field)} ${getOperatorSymbol(filter.operator)} ${filter.value}`}
                        </Chip>
                      ))}
                    </View>
                  </ScrollView>
                </View>
              )}
            </View>
          </View>
        }
        ListEmptyComponent={
          loading && page === 1 ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text style={styles.loadingText}>Ürünler yükleniyor...</Text>
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              {filters.length > 0 ? (
                <Text style={styles.emptyText}>
                  Filtreye uygun ürün bulunamadı. Filtreleri kaldırmayı deneyin.
                </Text>
              ) : search ? (
                <Text style={styles.emptyText}>
                  "{search}" için sonuç bulunamadı. Farklı bir arama yapmayı deneyin.
                </Text>
              ) : (
                <Text style={styles.emptyText}>
                  Ürün bulunamadı. Daha sonra tekrar kontrol edin.
                </Text>
              )}
            </View>
          )
        }
        ListFooterComponent={
          <>
            {(loading && page > 1) && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text style={styles.loadingText}>Daha fazla ürün yükleniyor...</Text>
              </View>
            )}
            
            {!loading && products.length > 0 && page < totalPages && (
              <Button 
                mode="outlined"
                style={styles.loadMoreButton}
                onPress={handleLoadMore}
              >
                Daha Fazla Ürün Yükle
              </Button>
            )}
          </>
        }
      />

      {/* Sıralama menüsü */}
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
      
      {/* Filtre ekleme diyaloğu */}
      {renderFilterDialog()}
      
      {/* Gelişmiş filtreleme diyaloğu */}
      <Portal>
        <Dialog visible={isAdvancedFilterVisible} onDismiss={() => setAdvancedFilterVisible(false)}>
          <Dialog.Title>Gelişmiş Filtreleme</Dialog.Title>
          <Dialog.ScrollArea style={{ maxHeight: 450 }}>
            <View style={styles.filterDialogContent}>
              <Text style={styles.filterDialogTitle}>Filtrelenecek Alan</Text>
              <View style={styles.filterChipsContainer}>
                {[
                  { label: 'İsim', value: 'name' },
                  { label: 'Kategori', value: 'category' },
                  { label: 'Fiyat', value: 'price' },
                  { label: 'Stok', value: 'stock' },
                ].map(field => (
                  <Chip
                    key={field.value}
                    selected={filterField === field.value}
                    onPress={() => setFilterField(field.value)}
                    style={styles.filterOptionChip}
                  >
                    {field.label}
                  </Chip>
                ))}
              </View>
              
              <Text style={styles.filterSectionTitle}>Operatör</Text>
              <View style={styles.filterChipsContainer}>
                {filterOperators.map(op => (
                  <Chip
                    key={op.value}
                    selected={filterOperator === op.value}
                    onPress={() => setFilterOperator(op.value)}
                    style={styles.filterOptionChip}
                  >
                    {op.label}
                  </Chip>
                ))}
              </View>
              
              <Text style={styles.filterSectionTitle}>Değer</Text>
              <TextInput
                value={filterValue}
                onChangeText={setFilterValue}
                placeholder="Değer girin"
                keyboardType={(filterField === 'price' || filterField === 'stock') ? 'numeric' : 'default'}
                style={styles.filterInput}
              />
              
              {filterField === 'category' && (
                <>
                  <Text style={styles.filterSectionTitle}>Hızlı Kategori Seçimi</Text>
                  <View style={styles.filterChipsContainer}>
                    {['Elektronik', 'Giyim', 'Aksesuar', 'Kitap', 'Mobilya'].map(category => (
                      <Chip
                        key={category}
                        onPress={() => setFilterValue(category)}
                        style={styles.filterOptionChip}
                      >
                        {category}
                      </Chip>
                    ))}
                  </View>
                </>
              )}
            </View>
          </Dialog.ScrollArea>
          <Dialog.Actions style={styles.filterDialogActions}>
            <Button onPress={() => setAdvancedFilterVisible(false)}>İptal</Button>
            <Button mode="contained" onPress={addAdvancedFilter}>Filtre Ekle</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

// Alan isimlerini okunabilir hale getir
function getReadableField(field: string): string {
  switch (field) {
    case 'name': return 'İsim';
    case 'category': return 'Kategori';
    case 'price': return 'Fiyat';
    case 'stock': return 'Stok';
    default: return field;
  }
}

// Operatör sembollerini getir
function getOperatorSymbol(operator: string): string {
  switch (operator) {
    case 'eq': return '=';
    case 'neq': return '≠';
    case 'gt': return '>';
    case 'lt': return '<';
    case 'gte': return '≥';
    case 'lte': return '≤';
    case 'like': return 'içerir';
    default: return operator;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listHeader: {
    paddingTop: 8,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  searchBar: {
    marginBottom: 8,
    elevation: 2,
    borderRadius: 8,
    height: 48,
  },
  filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterChip: {
    marginRight: 8,
  },
  activeFiltersContainer: {
    marginBottom: 16,
  },
  filterHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  activeFiltersLabel: {
    fontWeight: 'bold',
  },
  activeFilterChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  activeFilterChip: {
    marginRight: 8,
    marginBottom: 8,
  },
  productList: {
    paddingVertical: 8,
    paddingHorizontal: 8, // Daha az padding bırakarak ürünlere daha fazla alan tanıyalım
  },
  productRow: {
    justifyContent: 'space-between',
    width: '100%', // Tüm satırın genişliği
  },
  productCard: {
    flex: 1,
    marginHorizontal: 4,
    marginVertical: 8,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 3,
    width: '48%',  // Ekran genişliğinin yaklaşık yarısı
    maxWidth: '48%', // Maksimum genişlik sınırlaması
  },
  productImage: {
    height: 160,
    resizeMode: 'cover',
  },
  productCardContent: {
    padding: 12,
    height: 130, // İçerik kısmı için sabit yükseklik
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  productCategory: {
    fontSize: 12,
    opacity: 0.7,
  },
  productId: {
    fontSize: 12,
    opacity: 0.5,
  },
  productName: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 6,
  },
  productDescription: {
    fontSize: 13,
    opacity: 0.8,
    marginBottom: 8,
    maxHeight: 36,
  },
  productFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  productPrice: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#007bff',
  },
  stockContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stockText: {
    fontSize: 12,
    fontWeight: '500',
  },
  cardActions: {
    justifyContent: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
    padding: 8,
  },
  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    height: 200,
  },
  emptyText: {
    textAlign: 'center',
    opacity: 0.7,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
    height: 200,
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 8,
    textAlign: 'center',
    opacity: 0.8,
  },
  loadMoreButton: {
    marginTop: 16,
    marginBottom: 24,
    alignSelf: 'center',
  },
  detailButton: {
    width: '100%',
  },
  filterSectionTitle: {
    fontWeight: 'bold',
    marginBottom: 12,
    fontSize: 16,
    color: '#333',
  },
  filterChipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
    gap: 8,
  },
  filterOptionChip: {
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  filterInput: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    marginBottom: 20,
  },
  filterDialogContent: {
    padding: 16,
  },
  filterDialogTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  filterDialogActions: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
});
