# Windows Build Guide

Bu proje Electron + Vite tabanlıdır. Windows çıktısı almak için `electron-builder` kullanılır.

## Gereksinimler

- Node.js 18+ (LTS önerilir)
- npm
- Windows 10/11 x64

> Not: En sorunsuz yol, Windows paketini doğrudan Windows makinede üretmektir.

## Kurulum

```bash
npm install
```

## Geliştirme

```bash
npm run electron
```

Bu komut Vite’ı başlatır, `5173` hazır olunca Electron açılır.

## Windows Paket Alma

### 1) Kurulum sihirbazlı `.exe` (NSIS)

```bash
npm run build:win
```

### 2) Kurulumsuz taşınabilir `.exe`

```bash
npm run build:win:portable
```

### 3) İkisini birden üret

```bash
npm run build:win:all
```

## Çıktı Konumu

Üretilen dosyalar:

- `release/` klasörü içinde
- Örnek ad: `Dijital Kahramanlar-<version>-win-x64.exe`

## İkon Notu

Windows’ta özel uygulama ikonu için `.ico` dosyası önerilir. Mevcut görsel `dkahramanlar.png`; ileride `dkahramanlar.ico` eklenirse Windows çıktısında ikon daha tutarlı görünür.

