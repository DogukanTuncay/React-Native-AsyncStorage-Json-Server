import React from 'react';
import { 
  ScrollView, 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView
} from 'react-native';
import { StatusBar } from 'expo-status-bar';

const DocumentationScreen: React.FC = () => {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="auto" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Ürün Arama, Filtreleme ve Sıralama</Text>
        <Text style={styles.headerSubtitle}>Kullanım Kılavuzu</Text>
      </View>
      
      <ScrollView style={styles.scrollView}>
        <View style={styles.introSection}>
          <Text style={styles.introText}>
            Bu kılavuz, uygulamanızda ürün arama, filtreleme ve sıralama özelliklerinin nasıl çalıştığını 
            açıklamak için hazırlanmıştır. Bu özellikler, kullanıcıların istedikleri ürünleri daha hızlı 
            ve kolay bir şekilde bulmalarına yardımcı olacaktır.
          </Text>
        </View>
        
        <Section title="1. Ürün Arama Özelliği">
          <SubSection title="Arama Nedir?">
            <Text style={styles.paragraphText}>
              Arama özelliği, kullanıcıların belirli bir ürünü ismine göre bulmalarını sağlar. 
              Arama kutusuna yazdığınızda, sadece o isme uyan veya o isme benzer ürünler ekranda görünür. 
              Bu özellik, özellikle büyük ürün listeleriyle çalışırken faydalıdır.
            </Text>
          </SubSection>
          
          <SubSection title="Nasıl Çalışır?">
            <Text style={styles.paragraphText}>
              <Text style={styles.bold}>Arama Kutusu:</Text> Uygulamanın üst kısmında bir arama kutusu bulunur. 
              Bu kutuya, aramak istediğiniz ürünün adını yazabilirsiniz.{'\n\n'}
              <Text style={styles.bold}>Arama Sonuçları:</Text> Yazdığınız kelimeyle ilgili ürünler otomatik olarak listelenir. 
              Örneğin, "Telefon" yazarsanız, Başlıkta veya açıklamada "Telefon" kelimesi geçen tüm ürünler görünür.
            </Text>
          </SubSection>
          
          <SubSection title="Örnek Kullanım:">
            <Text style={styles.paragraphText}>
              <Text style={styles.bold}>Adı Arama:</Text> "Telefon" yazdığınızda Başlıkta veya açıklamada "Telefon" kelimesi geçen tüm ürünler görünür.
            </Text>
            <View style={styles.exampleBox}>
              <Text style={styles.exampleText}>
                Arama kutusuna "Telefon" yazın → Sonuçlar otomatik olarak filtrelenir
              </Text>
            </View>
          </SubSection>
        </Section>
        
        <Section title="2. Ürün Filtreleme Özelliği">
          <SubSection title="Filtreleme Nedir?">
            <Text style={styles.paragraphText}>
              Filtreleme, ürünleri belirli bir kategoriye, fiyata veya başka kriterlere göre daraltma işlemidir. 
              Bu özellik, çok sayıda ürün bulunduğunda kullanıcının sadece ilgilendiği ürünleri görmesini sağlar.
            </Text>
          </SubSection>
          
          <SubSection title="Nasıl Çalışır?">
            <Text style={styles.paragraphText}>
              <Text style={styles.bold}>Filtre Seçenekleri:</Text> Uygulama, kullanıcıya farklı filtre seçenekleri sunar. Örneğin:{'\n\n'}
              • <Text style={styles.bold}>Stok Filtreleme:</Text> Ürünlerin stoklarına göre filtreleme yapılabilir 
              (örneğin, stok sayısı 50 den yüksek ya da 30 dan düşük olanlar.).\n
              • <Text style={styles.bold}>Fiyat Filtreleme:</Text> Ürünleri belirli bir fiyat aralığına göre filtreleyebilirsiniz. 
              Örneğin, 100₺ - 500₺ arasındaki ürünleri görmek.{'\n\n'}
              <Text style={styles.bold}>Filtre Butonları:</Text> Kullanıcılar, filtre seçeneklerini seçmek için Filtre butonlarına 
              tıklayabilirler. Seçilen filtreler uygulandıktan sonra sadece o kriterlere uyan ürünler listelenir.
            </Text>
          </SubSection>
          
          <SubSection title="Örnek Kullanım:">
            <Text style={styles.paragraphText}>
              <Text style={styles.bold}>Stok Filtreleme:</Text> Eğer sadece Stok sayısı 50 üstündeki ürünleri 
              görmek isterseniz, "Stok" filtresine tıklayarak büyüktür seçip değer olarak 50 girerseniz yalnızca bu filtredeki ürünler gösterilir.{'\n\n'}
              <Text style={styles.bold}>Fiyat Aralığı Filtreleme:</Text> 100₺ ile 500₺ arasında fiyatı olan ürünleri görmek için 
              fiyat filtresini seçip öncelikle büyüktür diyip 100₺ ardındna bir filtre daha ekleyip küçüktür seçip 500₺ eklemelisiniz.
            </Text>
            
          </SubSection>
        </Section>
        
        <Section title="3. Ürün Sıralama Özelliği">
          <SubSection title="Sıralama Nedir?">
            <Text style={styles.paragraphText}>
              Sıralama özelliği, ürünlerinizi belirli bir düzende (örneğin, fiyat, tarih veya popülerlik gibi) 
              düzenlemenizi sağlar. Bu, kullanıcıların ürünleri istedikleri kritere göre sıralamalarını sağlar.
            </Text>
          </SubSection>
          
          <SubSection title="Nasıl Çalışır?">
            <Text style={styles.paragraphText}>
              <Text style={styles.bold}>Sıralama Seçenekleri:</Text> Kullanıcılar, ürünleri sıralamak için farklı kriterler seçebilirler. Örneğin:{'\n\n'}
              • <Text style={styles.bold}>Fiyat Yüksekten Düşüğe:</Text> En pahalı ürünler üstte yer alır.\n
              • <Text style={styles.bold}>Fiyat Düşükten Yükseğe:</Text> En ucuz ürünler üstte yer alır.\n
              <Text style={styles.bold}>Sıralama Butonları:</Text> Kullanıcılar sıralama butonlarına tıklayarak, 
              ürünlerin sıralanmasını istedikleri düzene göre değiştirebilirler.
            </Text>
          </SubSection>
          
         
        </Section>
        
        <Section title="4. Arama, Filtreleme ve Sıralama Özelliklerini Birlikte Kullanma">
          <SubSection title="Birlikte Kullanmanın Avantajı Nedir?">
            <Text style={styles.paragraphText}>
              Arama, filtreleme ve sıralama özelliklerini birlikte kullanarak, kullanıcılar çok daha hassas sonuçlar elde edebilirler. 
              Örneğin, bir kategoriye ait ürünlerin arasında sadece fiyatı 100₺ ile 500₺ arasında olan ürünleri arayabilir ve 
              bu ürünleri en pahalıdan en ucuza doğru sıralayabilirsiniz.
            </Text>
          </SubSection>
          
          <SubSection title="Nasıl Kullanılır?">
            <Text style={styles.paragraphText}>
              <Text style={styles.bold}>1. Arama:</Text> Öncelikle arama kutusuna bir kelime yazın.{'\n\n'}
              <Text style={styles.bold}>2. Filtreleme:</Text> Arama sonuçlarını daraltmak için kategori veya fiyat gibi filtreler ekleyin.{'\n\n'}
              <Text style={styles.bold}>3. Sıralama:</Text> Son olarak, sonuçları istediğiniz kritere göre sıralayın (fiyat, stok).
            </Text>
            <View style={styles.exampleBox}>
              <Text style={styles.exampleText}>
                "Telefon" yazın → stok seçip büyüktür 5 yazın   → Fiyat Büyüktür 100 seçin → Fiyat Küçüktür 500 seçin  → "Fiyat Artan" ile sıralayın
              </Text>
            </View>
          </SubSection>
        </Section>
        
        <Section title="Uygulamanın Kullanıcı Arayüzü">
          <Text style={styles.paragraphText}>
            Aşağıda, uygulamanın arayüzüne dair adım adım nasıl işlem yapıldığını gösteren bir özet bulunmaktadır:
          </Text>
          
          <SubSection title="1. Arama Alanı">
            <Text style={styles.paragraphText}>
              Kullanıcılar, Ürün Arama Kutusuna yazdıkları anahtar kelimelerle ürünleri arayabilirler.
            </Text>
          </SubSection>
          
          <SubSection title="2. Filtreleme Butonları">
            <Text style={styles.paragraphText}>
            <Text style={styles.bold}>Fiyat Filtreleme:</Text> Ürünleri belirli bir fiyat aralığına göre filtreleyebilirsiniz. 
            Örneğin, 100₺ - 500₺ arasındaki ürünleri görmek.{'\n\n'}
            </Text>
          </SubSection>
          
          <SubSection title="3. Sıralama Butonları">
            <Text style={styles.paragraphText}>
              Kullanıcılar, sıralama butonlarıyla ürünleri fiyat, tarih veya popülerlik gibi kriterlere göre sıralayabilirler.
            </Text>
          </SubSection>
        </Section>
        
        <View style={styles.footer}>
          <Text style={styles.footerText}>© {new Date().getFullYear()} | Tüm Hakları Saklıdır</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

interface SectionProps {
  title: string;
  children: React.ReactNode;
}

const Section: React.FC<SectionProps> = ({ title, children }) => {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      <View style={styles.sectionContent}>
        {children}
      </View>
    </View>
  );
};

interface SubSectionProps {
  title: string;
  children: React.ReactNode;
}

const SubSection: React.FC<SubSectionProps> = ({ title, children }) => {
  return (
    <View style={styles.subSection}>
      <Text style={styles.subSectionTitle}>{title}</Text>
      <View style={styles.subSectionContent}>
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  header: {
    backgroundColor: '#3498db',
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#fff',
    marginTop: 4,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  introSection: {
    padding: 16,
    backgroundColor: '#fff',
    marginBottom: 16,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#3498db',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  introText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#2c3e50',
  },
  section: {
    backgroundColor: '#fff',
    marginBottom: 16,
    marginHorizontal: 16,
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionHeader: {
    backgroundColor: '#f0f3f7',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  sectionContent: {
    padding: 16,
  },
  subSection: {
    marginBottom: 16,
  },
  subSectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#34495e',
    marginBottom: 8,
  },
  subSectionContent: {
    paddingLeft: 4,
  },
  paragraphText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#2c3e50',
    marginBottom: 12,
  },
  bold: {
    fontWeight: 'bold',
  },
  exampleBox: {
    backgroundColor: '#f8f9fc',
    padding: 12,
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: '#3498db',
    marginTop: 8,
    marginBottom: 8,
  },
  exampleText: {
    fontSize: 14,
    color: '#34495e',
  },
  footer: {
    padding: 24,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#7f8c8d',
  },
});

export default DocumentationScreen;