# miDespensa v2

Control de stock compartido para el hogar — ahora con caducidades, lista de compra inteligente y recetas con IA.

## Novedades en v2

### 📅 Fecha de caducidad por producto
- Campo opcional al añadir o editar cualquier producto
- Código de color automático: verde (>7 días) / ámbar (≤7 días) / rojo (≤2 días o caducado)
- Las tarjetas de la Despensa muestran el estado visualmente

### 🛒 Lista de la compra inteligente
- Se genera automáticamente con los productos agotados o por debajo del stock mínimo
- Lista manual para añadir lo que quieras con un campo de texto
- Botón para marcar como comprado (+1 al stock directamente)
- Exportar toda la lista a WhatsApp con un tap
- Sincronización en tiempo real entre miembros del hogar

### 🍳 Recetas con IA
- Analiza los productos que caducan en los próximos 7 días
- Genera 3 recetas españolas adaptadas a lo que tienes
- Powered by Claude (Anthropic)

### Pestaña "Caduca"
- Vista dedicada con todos los productos agrupados: Caducados / Esta semana / Este mes
- Acceso rápido a editar la fecha desde la lista
- Badge en la pestaña con el número de productos urgentes

## Stack técnico

- React 18 + Vite 5
- Supabase (Postgres + Realtime)
- PWA instalable
- API Anthropic para recetas

## Instalación

```bash
npm install
cp .env.example .env
# Rellenar VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY
```

## Migración de base de datos

Ejecutar `supabase_v2_migration.sql` en el SQL Editor de tu proyecto Supabase **antes** de desplegar.

```bash
npm run dev     # desarrollo
npm run build   # producción
```

## Variables de entorno

```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```
