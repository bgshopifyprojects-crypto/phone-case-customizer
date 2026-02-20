# Phone Layer - Telefon Kılıfı Şeffaflık Araçları

Bu proje, telefon kılıfı görsellerindeki şeffaflık maskelerini tespit etmek ve uygulamak için OpenCV tabanlı Python scriptleri içerir.

## İçindekiler

- [Kurulum](#kurulum)
  - [pyenv ile Kurulum](#pyenv-ile-kurulum)
  - [Normal Kurulum](#normal-kurulum)
- [Scriptler](#scriptler)
  - [find_transparent.py](#find_transparentpy)
  - [apply_phone_mask.py](#apply_phone_maskpy)
- [Testler](#testler)

---

## Kurulum

### pyenv ile Kurulum

pyenv kullanarak izole bir Python ortamı oluşturabilirsiniz:

```bash
# Python 3.11 kurulumu (eğer yoksa)
pyenv install 3.11.7

# Proje dizinine gidin
cd /path/to/phoneLayer

# Lokal Python versiyonunu ayarlayın
pyenv local 3.11.7

# Virtual environment oluşturun
python -m venv venv

# Virtual environment'ı aktifleştirin
source venv/bin/activate

# Bağımlılıkları yükleyin
pip install -r requirements.txt
```

### Normal Kurulum

Sistem Python'u veya mevcut bir Python kurulumu ile:

```bash
# Proje dizinine gidin
cd /path/to/phoneLayer

# Virtual environment oluşturun (önerilir)
python3 -m venv venv

# Virtual environment'ı aktifleştirin
# macOS/Linux:
source venv/bin/activate
# Windows:
# venv\Scripts\activate

# Bağımlılıkları yükleyin
pip install -r requirements.txt
```

### Bağımlılıklar

- `opencv-python>=4.8.0` - Görüntü işleme
- `numpy>=1.24.0` - Sayısal hesaplamalar

---

## Scriptler

### find_transparent.py

Bir klasördeki görselleri tarayarak belirli bir eşik değerinin üzerinde şeffaf piksel içerenleri listeler.

#### Kullanım

```bash
python find_transparent.py <klasör_yolu> [-t EŞİK]
```

#### Parametreler

| Parametre | Açıklama | Varsayılan |
|-----------|----------|------------|
| `klasör_yolu` | Taranacak klasörün yolu | (zorunlu) |
| `-t`, `--threshold` | Şeffaflık eşik yüzdesi | 25.0 |

#### Örnekler

```bash
# Varsayılan %25 eşik ile tarama
python find_transparent.py ./görseller

# %30 eşik ile tarama
python find_transparent.py ./görseller -t 30

# Mutlak yol ile kullanım
python find_transparent.py /Users/kullanici/Desktop/telefon_gorselleri
```

#### Desteklenen Formatlar

- PNG
- WebP
- TIFF
- BMP
- GIF

#### Çıktı Örneği

```
Images with transparency > 25%:

case_iphone15.png: 45.23%
case_samsung_s24.png: 38.67%
case_pixel8.png: 31.45%
```

---

### apply_phone_mask.py

Şeffaf bir referans telefon kılıfı görselindeki şeffaflık maskesini, şeffaf olmayan bir hedef telefon görseline uygular. Farklı boyutlardaki telefonlar için otomatik ölçekleme yapar.

#### Nasıl Çalışır

1. **Arka Plan Tespiti**: Sol üst piksel arka plan rengi olarak kabul edilir
2. **Telefon Sınırları Tespiti**: Çoğunluk oylaması (median) kullanarak kenarları tespit eder
   - Yan butonlar gibi çıkıntıları görmezden gelir
   - Her kenar için en yaygın pozisyonu kullanır
3. **Maske Ölçekleme**: Referans maskesini hedef telefonun boyutlarına uyacak şekilde ölçekler
4. **Şeffaflık Uygulama**: Kamera, flaş vb. kesimler korunarak maske uygulanır

#### Kullanım

```bash
python apply_phone_mask.py <referans_görsel> <hedef_görsel> [-t TOLERANS]
```

#### Parametreler

| Parametre | Açıklama | Varsayılan |
|-----------|----------|------------|
| `referans_görsel` | Şeffaf telefon kılıfı PNG dosyası | (zorunlu) |
| `hedef_görsel` | Şeffaflık uygulanacak telefon görseli | (zorunlu) |
| `-t`, `--tolerance` | Arka plan renk toleransı (0-255) | 30 |

#### Örnekler

```bash
# Temel kullanım
python apply_phone_mask.py referans_kilif.png hedef_telefon.jpg

# Daha yüksek tolerans ile (daha geniş arka plan algılama)
python apply_phone_mask.py referans_kilif.png hedef_telefon.png -t 50

# Farklı klasörlerdeki dosyalar
python apply_phone_mask.py ./seffaf/iphone_case.png ./hedefler/telefon1.jpg
```

#### Çıktı Dosyaları

Script iki dosya oluşturur:

1. **`{hedef_isim}_layer.png`** - Şeffaflık uygulanmış son görsel
2. **`{hedef_isim}_debug.png`** - Tespit edilen sınırları gösteren hata ayıklama görseli
   - Yeşil dikdörtgen: Referans telefon sınırları
   - Kırmızı dikdörtgen: Hedef telefon sınırları

#### Çıktı Örneği

```
Reference image: 800x1200
Target image: 1000x1500

Detecting phone boundaries...
Reference phone bbox: BoundingBox(l=50, t=30, r=750, b=1170, w=700, h=1140)
Target phone bbox: BoundingBox(l=60, t=40, r=940, b=1460, w=880, h=1420)

Scaling mask to fit target...

Output saved to: ./hedef_telefon_layer.png
Debug visualization saved to: ./hedef_telefon_debug.png
```

---

## İpuçları

### Tolerans Değeri Ayarlama

- **Düşük tolerans (10-20)**: Sadece tam arka plan rengine yakın pikseller algılanır
- **Orta tolerans (25-40)**: Çoğu durum için uygundur
- **Yüksek tolerans (50+)**: Gölgeli veya gradyanlı arka planlar için

### Sorun Giderme

1. **Telefon sınırları yanlış tespit ediliyor**
   - Tolerans değerini artırın veya azaltın
   - Arka planın düz renk olduğundan emin olun
   - Sol üst köşenin arka plan olduğunu doğrulayın

2. **Maske düzgün uygulanmıyor**
   - Debug görselini kontrol edin
   - Her iki görseldeki telefon pozisyonlarını karşılaştırın

3. **Kamera kesimleri kayıyor**
   - Referans ve hedef telefonların aynı model olduğundan emin olun
   - Farklı modeller için farklı referans görselleri kullanın

---

## Testler

Test scriptlerini çalıştırmak için `run_tests.sh` kullanabilirsiniz:

```bash
./run_tests.sh
```

Bu script aşağıdaki testleri çalıştırır:

1. **find_transparent.py** testi: `tests/test_find_transparents` klasöründeki görselleri tarar
2. **apply_phone_mask.py** testleri: `tests/tests_apply_mask0` - `tests/tests_apply_mask7` klasörlerindeki referans ve hedef görselleri işler

### Manuel Test Çalıştırma

```bash
# find_transparent.py testi
python3 find_transparent.py tests/test_find_transparents

# apply_phone_mask.py testleri
python3 apply_phone_mask.py tests/tests_apply_mask0/refer.png tests/tests_apply_mask0/target.png
python3 apply_phone_mask.py tests/tests_apply_mask1/refer.png tests/tests_apply_mask1/target.png
# ... vb.
```

---

## Lisans

Bu proje kişisel kullanım için geliştirilmiştir.
