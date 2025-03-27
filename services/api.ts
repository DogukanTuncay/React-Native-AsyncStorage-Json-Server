import axios from 'axios';
import { Platform } from 'react-native';

// API URL'ini cihaza göre ayarlayalım
// Emülatörler ve gerçek cihazlar için farklı IP'ler gerekebilir
let API_URL = 'http://10.0.2.2:3000'; // Android emülatör için varsayılan

if (Platform.OS === 'ios') {
  API_URL = 'http://localhost:3000'; // iOS emülatör için
} 

// Tarayıcıdan erişiliyorsa localhost kullan
if (Platform.OS === 'web') {
  API_URL = 'http://localhost:3000';
}

// Alternatif URL'ler - gerekirse bu değerlerden birini seçip yukarıdaki API_URL'i değiştirebilirsiniz
const API_URLS = {
  androidEmulator: 'http://10.0.2.2:3000',
  iosEmulator: 'http://localhost:3000',
  windows: 'http://localhost:3000',
  mac: 'http://localhost:3000',
  // Gerçek cihazlar için kendi IP adresinizi kullanın
  realDevice: 'http://192.168.1.X:3000',
};

console.log('Platform:', Platform.OS);
console.log('API URL:', API_URL);

// Ürün türünü tanımla
export interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  stock: number;
  description: string;
  imageUrl: string;
  uniqueId?: string; // Opsiyonel, sayfalamada her ürünü benzersiz tanımlamak için
}

// Filtre türünü tanımla
export interface Filter {
  field: string;
  operator: 'eq' | 'neq' | 'gt' | 'lt' | 'gte' | 'lte' | 'like';
  value: string | number;
}

// Axios instance'ı oluştur
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 saniye timeout ekleyelim
});

// Axios interceptor ile istekleri ve cevapları logla
api.interceptors.request.use(
  config => {
    console.log(`API İsteği: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  error => {
    console.error('API İstek Hatası:', error);
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  response => {
    console.log(`API Cevabı: ${response.status} ${response.config.url}`);
    return response;
  },
  error => {
    console.error('API Cevap Hatası:', error.message);
    console.error('Hata Detayları:', error.response?.data || 'Yanıt verisi yok');
    console.error('İstek URL:', error.config?.url || 'URL bilgisi yok');
    return Promise.reject(error);
  }
);

// Tüm ürünleri getir
export const getProducts = async (
  page = 1,
  limit = 10,
  sort = 'id',
  order = 'asc',
  filters: Filter[] = []
): Promise<{ products: Product[]; total: number }> => {
  try {
    console.log(`Ürünler getiriliyor: Sayfa=${page}, Limit=${limit}, Sıralama=${sort} ${order}`);
    
    // Önce tüm verileri alıp sonra manuel sayfalama yapalım
    // JSON Server'ın sayfalama mekanizması sorun çıkarıyor
    try {
      // Öncelikle filtreleri uygulayarak tüm ürünleri getirelim
      let allProductsUrl = `/products?_sort=${sort}&_order=${order}`;
      
      // Filtreleri URL'e ekle
      filters.forEach(filter => {
        const { field, operator, value } = filter;
        
        switch (operator) {
          case 'eq':
            allProductsUrl += `&${field}=${value}`;
            break;
          case 'neq':
            allProductsUrl += `&${field}_ne=${value}`;
            break;
          case 'gt':
            allProductsUrl += `&${field}_gt=${value}`;
            break;
          case 'lt':
            allProductsUrl += `&${field}_lt=${value}`;
            break;
          case 'gte':
            allProductsUrl += `&${field}_gte=${value}`;
            break;
          case 'lte':
            allProductsUrl += `&${field}_lte=${value}`;
            break;
          case 'like':
            allProductsUrl += `&${field}_like=${encodeURIComponent(value.toString())}`;
            break;
        }
      });
      
      console.log('Tüm veriler için API isteği:', `${API_URL}${allProductsUrl}`);
      
      // API isteğini deneyelim, 3 saniyelik timeout ile
      const allProductsResponse = await api.get(allProductsUrl, { timeout: 3000 });
      const allProducts = allProductsResponse.data || [];
      
      // Boş veri kontrolü
      if (!Array.isArray(allProducts)) {
        console.warn('API geçersiz veri döndürdü, dizi bekleniyor ama aldık:', typeof allProducts);
        return generateDummyProducts(page, limit, sort, order, filters);
      }
      
      console.log(`Toplam filtrelenmiş veri: ${allProducts.length}`);
      
      // Serverdan gelen verileri tekrar sırala (emin olmak için)
      let sortedProducts = [...allProducts];
      
      // Tüm gelen ürünleri lokal olarak sıralama uygula
      if (sort && sort !== 'id') {
        console.log(`Kesin sıralama uygulanıyor: Alan=${sort}, Yön=${order}`);
        sortedProducts = sortProductsByField(sortedProducts, sort, order);
      }
      
      // Manuel sayfalama yapma
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      
      // Sıralanmış ürünleri sayfala
      const paginatedProducts = sortedProducts.slice(startIndex, endIndex).map((product: Product, index: number) => {
        // Ürün ID'sini sayfaya göre benzersiz yap
        return {
          ...product,
          // uniqueId: Bu özellik sadece client tarafında kullanılacak, 
          // gerçek veri değişmeyecek ama her sayfada farklı gözükecek
          uniqueId: `${product.id}-p${page}-${index}-${sort}-${order}`
        };
      });
      
      console.log(`Manuel sayfalama: Başlangıç=${startIndex}, Bitiş=${endIndex}, Dönen Ürün=${paginatedProducts.length}`);
      
      return {
        products: paginatedProducts,
        total: allProducts.length
      };
    } catch (innerError) {
      console.error('API yanıt işlenirken hata:', innerError);
      // API hatası durumunda dummy veri döndür
      return generateDummyProducts(page, limit, sort, order, filters);
    }
    
  } catch (error) {
    console.error('Ürünler getirilirken hata oluştu:', error);
    // Hata durumunda dummy veri döndür
    return generateDummyProducts(page, limit, sort, order, filters);
  }
};

// Dummy ürünleri oluştur - API çalışmadığında veya veri yoksa test datası sağlar
const generateDummyProducts = (
  page = 1,
  limit = 10,
  sort = 'id',
  order = 'asc',
  filters: Filter[] = []
): { products: Product[]; total: number } => {
  console.log('Bağlantı hatası nedeniyle örnek veriler gösteriliyor');
  
  // Offline mod için örnek ürünleri oluştur
  let dummyProducts: Product[] = [];
  
  // Toplam ürün sayısı
  const totalDummyProducts = 25;
  
  // Çeşitli örnek ürünler oluştur
  for (let i = 0; i < totalDummyProducts; i++) {
    dummyProducts.push({
      id: i + 1,
      uniqueId: `${i + 1}-p${page}-${i % limit}`, // Benzersiz ID ekle
      name: `Örnek Ürün ${i + 1}`,
      category: i % 5 === 0 ? "Elektronik" : 
                i % 5 === 1 ? "Bilgisayar" : 
                i % 5 === 2 ? "Aksesuar" : 
                i % 5 === 3 ? "Giyim" : "Ev Eşyası",
      price: 1000 + (i * 500),
      stock: 5 + i,
      description: `Bu bir örnek ürün açıklamasıdır (#${i + 1}). 
                   JSON Server çalışmadığında offline modda görüntülenir. 
                   Ürün detayları burada görüntülenecektir.`,
      imageUrl: `https://picsum.photos/id/${(i % 30) + 1}/200/300`
    });
  }
  
  // Önce sıralama uygula
  dummyProducts = sortProductsByField(dummyProducts, sort, order);
  
  // Sonra filtreleri uygula
  if (filters.length > 0) {
    console.log('Filtreler uygulanıyor:', filters);
    dummyProducts = applyFilters(dummyProducts, filters);
  }
  
  // Son olarak search filtresini özel olarak uygula
  const searchFilter = filters.find(f => f.field === 'name' && f.operator === 'like');
  if (searchFilter) {
    const searchValue = searchFilter.value.toString().toLowerCase();
    dummyProducts = dummyProducts.filter(p => 
      p.name.toLowerCase().includes(searchValue)
    );
  }
  
  const total = dummyProducts.length;
  
  // Sayfalama
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedProducts = dummyProducts.slice(startIndex, endIndex);
  
  console.log(`Dummy veri sayfalama: Toplam=${total}, Dönen=${paginatedProducts.length}`);
  
  return { products: paginatedProducts, total };
};

// Ürünleri bir alana göre sırala
function sortProductsByField(products: Product[], field: string, order: string): Product[] {
  console.log(`Ürünler sıralanıyor: Alan=${field}, Sıra=${order}`);
  
  return [...products].sort((a, b) => {
    const aValue = a[field as keyof Product];
    const bValue = b[field as keyof Product];
    
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return order === 'asc' 
        ? aValue.localeCompare(bValue) 
        : bValue.localeCompare(aValue);
    }
    
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return order === 'asc' ? aValue - bValue : bValue - aValue;
    }
    
    return 0;
  });
}

// Filtreleri uygula
function applyFilters(products: Product[], filters: Filter[]): Product[] {
  return products.filter(product => {
    // Tüm filtreleri AND mantığıyla uygula
    return filters.every(filter => {
      const { field, operator, value } = filter;
      const fieldValue = product[field as keyof Product];
      
      switch (operator) {
        case 'eq':
          return fieldValue == value;
        case 'neq':
          return fieldValue != value;
        case 'gt':
          return typeof fieldValue === 'number' && fieldValue > Number(value);
        case 'lt':
          return typeof fieldValue === 'number' && fieldValue < Number(value);
        case 'gte':
          return typeof fieldValue === 'number' && fieldValue >= Number(value);
        case 'lte':
          return typeof fieldValue === 'number' && fieldValue <= Number(value);
        case 'like':
          return typeof fieldValue === 'string' && 
            fieldValue.toLowerCase().includes(value.toString().toLowerCase());
        default:
          return true;
      }
    });
  });
}

// API verilerine filtreleri uygula (sunucu tarafından filtreleme düzgün çalışmadığında)
function applyFiltersToApiData(products: Product[], filters: Filter[]): Product[] {
  if (!filters || filters.length === 0) return products;
  
  return products.filter(product => {
    return filters.every(filter => {
      const { field, operator, value } = filter;
      const fieldValue = product[field as keyof Product];
      
      switch (operator) {
        case 'eq':
          return fieldValue == value;
        case 'neq':
          return fieldValue != value;
        case 'gt':
          return typeof fieldValue === 'number' && fieldValue > Number(value);
        case 'lt':
          return typeof fieldValue === 'number' && fieldValue < Number(value);
        case 'gte':
          return typeof fieldValue === 'number' && fieldValue >= Number(value);
        case 'lte':
          return typeof fieldValue === 'number' && fieldValue <= Number(value);
        case 'like':
          return typeof fieldValue === 'string' && 
            fieldValue.toLowerCase().includes(value.toString().toLowerCase());
        default:
          return true;
      }
    });
  });
}

// Tek bir ürünü getir
export const getProduct = async (id: number): Promise<Product> => {
  try {
    const response = await api.get(`/products/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Ürün #${id} getirilirken hata oluştu:`, error);
    throw error;
  }
};

// Yeni ürün ekle
export const addProduct = async (product: Omit<Product, 'id'>): Promise<Product> => {
  try {
    const response = await api.post('/products', product);
    return response.data;
  } catch (error) {
    console.error('Ürün eklenirken hata oluştu:', error);
    throw error;
  }
};

// Mevcut ürünü güncelle
export const updateProduct = async (id: number, product: Partial<Product>): Promise<Product> => {
  try {
    const response = await api.put(`/products/${id}`, product);
    return response.data;
  } catch (error) {
    console.error(`Ürün #${id} güncellenirken hata oluştu:`, error);
    throw error;
  }
};

// Ürünü sil
export const deleteProduct = async (id: number): Promise<void> => {
  try {
    await api.delete(`/products/${id}`);
  } catch (error) {
    console.error(`Ürün #${id} silinirken hata oluştu:`, error);
    throw error;
  }
};

export default api; 