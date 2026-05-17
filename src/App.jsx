import { useState, useEffect, useRef } from "react";
import { supabase } from "./supabase.js";

const PANTRY_KEY = "midespensa-pantry-id";

const CATEGORIES = [
  { id:"todas",      label:"Todas",       emoji:"🏪" },
  { id:"lacteos",    label:"Lácteos",     emoji:"🥛" },
  { id:"carnes",     label:"Carnes",      emoji:"🥩" },
  { id:"verduras",   label:"Verduras",    emoji:"🥦" },
  { id:"frutas",     label:"Frutas",      emoji:"🍎" },
  { id:"cereales",   label:"Cereales",    emoji:"🌾" },
  { id:"pan",        label:"Pan",         emoji:"🍞" },
  { id:"pasta",      label:"Pasta/Arroz", emoji:"🍝" },
  { id:"legumbres",  label:"Legumbres",   emoji:"🫘" },
  { id:"conservas",  label:"Conservas",   emoji:"🥫" },
  { id:"encurtidos", label:"Encurtidos",  emoji:"🫙" },
  { id:"congelados", label:"Congelados",  emoji:"🧊" },
  { id:"huevos",     label:"Huevos",      emoji:"🥚" },
  { id:"cafe",       label:"Café/Té",     emoji:"☕" },
  { id:"refrescos",  label:"Refrescos",   emoji:"🥤" },
  { id:"energeticas",label:"Energéticas", emoji:"⚡" },
  { id:"agua",       label:"Agua",        emoji:"💧" },
  { id:"zumos",      label:"Zumos",       emoji:"🧃" },
  { id:"alcohol",    label:"Alcohol",     emoji:"🍺" },
  { id:"snacks",     label:"Snacks",      emoji:"🍿" },
  { id:"dulces",     label:"Dulces",      emoji:"🍫" },
  { id:"salsas",     label:"Salsas",      emoji:"🫙" },
  { id:"aceites",    label:"Aceites",     emoji:"🫒" },
  { id:"especias",   label:"Especias",    emoji:"🧂" },
  { id:"limpieza",   label:"Limpieza",    emoji:"🧹" },
  { id:"higiene",    label:"Higiene",     emoji:"🧴" },
  { id:"mascotas",   label:"Mascotas",    emoji:"🐾" },
  { id:"otros",      label:"Otros",       emoji:"📦" },
];
const EMOJIS = ["📦","🥛","🧀","🥚","🥩","🍗","🐟","🥦","🥕","🍅","🍎","🍌","🍋","🍊","🍇","🫐","🥑","🌾","🍞","🥐","🍝","🍚","🫘","🥫","🫙","🧊","☕","🍵","🧉","🥤","⚡","💧","🧃","🍺","🍷","🥂","🍿","🍫","🍬","🍭","🧁","🍰","🥜","🧂","🫒","🧴","🧹","🧼","🧻","🐾","🪴"];
const UNITS = ["ud","kg","g","L","ml","pack","bote","lata","bolsa","docena"];
const SUPERMARKETS = [
  { id:"mercadona", label:"Mercadona",       color:"#00904A", bg:"#E6F5EE" },
  { id:"lidl",      label:"Lidl",            color:"#0050AA", bg:"#E6EEF8" },
  { id:"aldi",      label:"Aldi",            color:"#00529B", bg:"#E6EEF8" },
  { id:"carrefour", label:"Carrefour",       color:"#0066CC", bg:"#E6F0FA" },
  { id:"dia",       label:"Día",             color:"#E2001A", bg:"#FDEAEC" },
  { id:"elcorte",   label:"El Corte Inglés", color:"#007A33", bg:"#E6F3EB" },
  { id:"eroski",    label:"Eroski",          color:"#E8000D", bg:"#FDEAEB" },
  { id:"alcampo",   label:"Alcampo",         color:"#E84E10", bg:"#FEF0EA" },
  { id:"consum",    label:"Consum",          color:"#C8001E", bg:"#FDEAEC" },
  { id:"bonpreu",   label:"BonPreu",         color:"#F7A600", bg:"#FEF8E6" },
  { id:"spar",      label:"Spar",            color:"#007A33", bg:"#E6F3EB" },
  { id:"supercor",  label:"Supercor",        color:"#006838", bg:"#E6F2EC" },
  { id:"coviran",   label:"Covirán",         color:"#D4000A", bg:"#FDEAEB" },
  { id:"simply",    label:"Simply",          color:"#FF6200", bg:"#FEF0E6" },
  { id:"hipercor",  label:"Hipercor",        color:"#005B99", bg:"#E6EEF6" },
  { id:"otro",      label:"Otro",            color:"#6B7280", bg:"#F3F4F6" },
];
const BRANDS = [
  "Hacendado","Milbona","Auchan","Carrefour","Dia",
  "Danone","Nestlé","Pascual","Puleva","Central Lechera Ast.",
  "Bimbo","Gallo","Knorr","Heinz","Hellmann's",
  "Nocilla","Nutella","Cola Cao","Nescafé","Marcilla",
  "El Pozo","Campofrío","Argal","Oscar Mayer","Pescanova",
  "Findus","Florette","La Española","Carbonell","Borges",
  "Font Vella","Bezoya","Mahou","Estrella Damm","San Miguel",
  "Coca-Cola","Pepsi","Don Simón","Kellogg's","Quaker",
  "Ariel","Fairy","Mistol","Skip","Finish",
];

const defaultForm = { name:"", barcode:"", price:"", category:"otros", unit:"ud", minStock:"2", emoji:"📦", supermarket:"", brand:"", brandCustom:"", expiryDate:"" };

const genId = (len=6) => Math.random().toString(36).slice(2,2+len).toUpperCase();

// ── Helpers de caducidad ───────────────────────────────────────────────────
const daysUntilExpiry = (dateStr) => {
  if (!dateStr) return null;
  const today = new Date();
  today.setHours(0,0,0,0);
  const exp = new Date(dateStr + "T00:00:00");
  return Math.round((exp - today) / 86400000);
};

const expiryInfo = (days) => {
  if (days === null) return null;
  if (days < 0)   return { cls:"exp-red",   dayCls:"cd-red",   borderCls:"ci-red",   label: days === -1 ? "Caducó ayer" : `Hace ${Math.abs(days)}d` };
  if (days === 0) return { cls:"exp-red",   dayCls:"cd-red",   borderCls:"ci-red",   label: "¡Caduca HOY!" };
  if (days <= 2)  return { cls:"exp-red",   dayCls:"cd-red",   borderCls:"ci-red",   label: `Caduca en ${days}d` };
  if (days <= 7)  return { cls:"exp-amber", dayCls:"cd-amber", borderCls:"ci-amber", label: `Caduca en ${days}d` };
  if (days <= 30) return { cls:"exp-green", dayCls:"cd-green", borderCls:"",         label: `${days} días` };
  return null;
};

const rowToProduct = r => ({
  id:r.id, pantryId:r.pantry_id, name:r.name, barcode:r.barcode||"",
  price:parseFloat(r.price)||0, category:r.category||"otros", unit:r.unit||"ud",
  minStock:r.min_stock||2, emoji:r.emoji||"📦", supermarket:r.supermarket||"",
  brand:r.brand||"", brandCustom:r.brand_custom||"", stock:r.stock||0,
  createdAt:r.created_at, expiryDate:r.expiry_date||null, addedBy:r.added_by||null,
});
const rowToMember  = r => ({ id:r.id, pantryId:r.pantry_id, name:r.name, joined:r.joined||"" });
const rowToShopItem = r => ({ id:r.id, pantryId:r.pantry_id, name:r.name, emoji:r.emoji||"📦", createdAt:r.created_at });

export default function App() {
  // ── Estado existente ───────────────────────────────────────────────────
  const [screen, setScreen]           = useState("loading");
  const [pantryId, setPantryId]       = useState(null);
  const [pantryName, setPantryName]   = useState("Mi Despensa");
  const [setupMode, setSetupMode]     = useState("create");
  const [setupCode, setSetupCode]     = useState("");
  const [setupName, setSetupName]     = useState("");
  const [setupError, setSetupError]   = useState("");
  const [setupLoading, setSetupLoading] = useState(false);
  const [products, setProducts]       = useState([]);
  const [members,  setMembers]        = useState([]);
  const [tab,      setTab]            = useState("despensa");
  const [search,   setSearch]         = useState("");
  const [cat,      setCat]            = useState("todas");
  const [modal,    setModal]          = useState(null);
  const [editId,   setEditId]         = useState(null);
  const [form,     setForm]           = useState(defaultForm);
  const [dataLoading, setDataLoading] = useState(false);
  const [toast,    setToast]          = useState(null);
  const [barcode,  setBarcode]        = useState("");
  const [memberName, setMemberName]   = useState("");
  const [sortBy,   setSortBy]         = useState("name");
  const [syncing,  setSyncing]        = useState(false);
  const [showShare, setShowShare]     = useState(false);
  const [cameraOpen, setCameraOpen]   = useState(false);
  const [camState,   setCamState]     = useState("idle");
  const [camError,   setCamError]     = useState("");
  // ── Estado nuevo v2 ───────────────────────────────────────────────────
  const [manualShopItems, setManualShopItems] = useState([]);
  const [shopInput,       setShopInput]       = useState("");
  const [recipes,         setRecipes]         = useState([]);
  const [recipesLoading,  setRecipesLoading]  = useState(false);
  // ── Identidad del usuario activo ──────────────────────────────────────
  const [currentUser, setCurrentUser]         = useState(() => localStorage.getItem("midespensa-user") || "");
  const [askingName,  setAskingName]          = useState(false);
  const [userInput,   setUserInput]           = useState("");

  const videoRef    = useRef(null);
  const streamRef   = useRef(null);
  const rafRef      = useRef(null);
  const detectorRef = useRef(null);
  const lockedRef   = useRef(false);
  const productsRef = useRef(products);
  useEffect(() => { productsRef.current = products; }, [products]);
  useEffect(() => () => stopCamera(), []);

  useEffect(() => {
    const saved = localStorage.getItem(PANTRY_KEY);
    const user  = localStorage.getItem("midespensa-user");
    if (saved) {
      setPantryId(saved);
      setScreen("app");
      if (!user) { setAskingName(true); setTab("grupo"); }
    } else setScreen("setup");
  }, []);

  useEffect(() => {
    if (!pantryId) return;
    loadData(pantryId);
    const unsub = subscribeRealtime(pantryId);
    return unsub;
  }, [pantryId]);

  // ── Carga de datos (ahora también shopping_list) ───────────────────────
  const loadData = async (pid) => {
    setDataLoading(true);
    const [{ data: prods }, { data: mems }, { data: pantry }, { data: shop }] = await Promise.all([
      supabase.from("products").select("*").eq("pantry_id", pid).order("created_at"),
      supabase.from("members").select("*").eq("pantry_id", pid),
      supabase.from("pantries").select("name").eq("id", pid).single(),
      supabase.from("shopping_list").select("*").eq("pantry_id", pid).order("created_at"),
    ]);
    if (prods)  setProducts(prods.map(rowToProduct));
    if (mems)   setMembers(mems.map(rowToMember));
    if (pantry) setPantryName(pantry.name);
    if (shop)   setManualShopItems(shop.map(rowToShopItem));
    setDataLoading(false);
  };

  // ── Realtime (ahora también shopping_list) ────────────────────────────
  const subscribeRealtime = (pid) => {
    const ch = supabase.channel(`pantry-${pid}`)
      .on("postgres_changes", { event:"*", schema:"public", table:"products", filter:`pantry_id=eq.${pid}` }, payload => {
        setSyncing(true); setTimeout(() => setSyncing(false), 1200);
        if (payload.eventType==="INSERT") setProducts(prev => prev.find(p=>p.id===payload.new.id) ? prev : [...prev, rowToProduct(payload.new)]);
        else if (payload.eventType==="UPDATE") setProducts(prev => prev.map(p => p.id===payload.new.id ? rowToProduct(payload.new) : p));
        else if (payload.eventType==="DELETE") setProducts(prev => prev.filter(p => p.id!==payload.old.id));
      })
      .on("postgres_changes", { event:"*", schema:"public", table:"members", filter:`pantry_id=eq.${pid}` }, payload => {
        if (payload.eventType==="INSERT") setMembers(prev => prev.find(m=>m.id===payload.new.id) ? prev : [...prev, rowToMember(payload.new)]);
        else if (payload.eventType==="DELETE") setMembers(prev => prev.filter(m => m.id!==payload.old.id));
      })
      .on("postgres_changes", { event:"*", schema:"public", table:"shopping_list", filter:`pantry_id=eq.${pid}` }, payload => {
        setSyncing(true); setTimeout(() => setSyncing(false), 1200);
        if (payload.eventType==="INSERT") setManualShopItems(prev => prev.find(i=>i.id===payload.new.id) ? prev : [...prev, rowToShopItem(payload.new)]);
        else if (payload.eventType==="DELETE") setManualShopItems(prev => prev.filter(i => i.id!==payload.old.id));
      })
      .subscribe();
    return () => supabase.removeChannel(ch);
  };

  const notify = (msg, type="ok") => { setToast({msg,type}); setTimeout(()=>setToast(null),2800); };

  // ── Setup ──────────────────────────────────────────────────────────────
  const handleCreate = async () => {
    setSetupError(""); setSetupLoading(true);
    const id = genId(6), name = setupName.trim() || "Mi Despensa";
    const { error } = await supabase.from("pantries").insert({ id, name });
    if (error) { setSetupError("Error al crear la despensa. Inténtalo de nuevo."); setSetupLoading(false); return; }
    localStorage.setItem(PANTRY_KEY, id);
    setPantryId(id); setPantryName(name); setScreen("app"); setSetupLoading(false);
    setAskingName(true); setTab("grupo");
  };

  const handleJoin = async () => {
    const code = setupCode.trim().toUpperCase();
    if (code.length < 4) { setSetupError("Introduce un código válido."); return; }
    setSetupError(""); setSetupLoading(true);
    const { data, error } = await supabase.from("pantries").select("id,name").eq("id", code).single();
    if (error || !data) { setSetupError("Código no encontrado. Revísalo con quien te lo compartió."); setSetupLoading(false); return; }
    localStorage.setItem(PANTRY_KEY, data.id);
    setPantryId(data.id); setPantryName(data.name); setScreen("app"); setSetupLoading(false);
    setAskingName(true); setTab("grupo");
  };

  const leavePantry = () => {
    if (!confirm("¿Salir de esta despensa? Podrás volver a unirte con el código.")) return;
    localStorage.removeItem(PANTRY_KEY);
    localStorage.removeItem("midespensa-user");
    setCurrentUser(""); setPantryId(null); setProducts([]); setMembers([]); setManualShopItems([]); setScreen("setup");
  };

  const saveUserName = () => {
    const name = userInput.trim();
    if (!name) return;
    localStorage.setItem("midespensa-user", name);
    setCurrentUser(name);
    setAskingName(false);
    setUserInput("");
    notify(`¡Hola, ${name}! 👋`);
  };

  // ── Stock ──────────────────────────────────────────────────────────────
  const updateStock = async (id, delta) => {
    const p = productsRef.current.find(x=>x.id===id); if (!p) return;
    const newStock = Math.max(0, (p.stock||0) + delta);
    setProducts(prev => prev.map(x => x.id===id ? {...x, stock:newStock} : x));
    await supabase.from("products").update({ stock: newStock }).eq("id", id);
  };

  const handleBarcodeInput = async (code) => {
    const bc = (code||barcode).trim(); if (!bc) return;
    setBarcode("");
    // Si ya existe en catálogo, suma stock
    const found = productsRef.current.find(p => p.barcode===bc);
    if (found) { updateStock(found.id, 1); notify(`+1 ${found.name} 📦`); return; }
    // Buscar en OpenFoodFacts
    notify("Buscando producto…","info");
    try {
      const res = await fetch(`https://world.openfoodfacts.org/api/v0/product/${bc}.json`);
      const data = await res.json();
      if (data.status === 1) {
        const p = data.product;
        const rawName = p.product_name_es || p.product_name || p.abbreviated_product_name || "";
        const name = rawName.trim();
        const brand = p.brands?.split(",")[0]?.trim() || "";
        // Mapear categorías OFF → nuestras categorías
        const tags = (p.categories_tags||[]).join(" ");
        let category = "otros";
        if (/dairy|lacteo|leche|yogur|queso/.test(tags))     category = "lacteos";
        else if (/meat|carne|pollo|jam/.test(tags))           category = "carnes";
        else if (/fish|pescado|mariscos/.test(tags))          category = "carnes";
        else if (/vegetable|verdura|hortaliza/.test(tags))    category = "verduras";
        else if (/fruit|fruta/.test(tags))                    category = "frutas";
        else if (/cereal|muesli/.test(tags))                  category = "cereales";
        else if (/bread|pan|bakery/.test(tags))               category = "pan";
        else if (/pasta|rice|arroz|noodle/.test(tags))        category = "pasta";
        else if (/legum|bean|lentil|garbanzo/.test(tags))     category = "legumbres";
        else if (/conserv|canned|tin/.test(tags))             category = "conservas";
        else if (/pickle|encurtido|vinegar/.test(tags))       category = "encurtidos";
        else if (/frozen|congel/.test(tags))                  category = "congelados";
        else if (/egg|huevo/.test(tags))                      category = "huevos";
        else if (/coffee|cafe|tea|te|infusion/.test(tags))    category = "cafe";
        else if (/soda|refres|cola|limon/.test(tags))         category = "refrescos";
        else if (/energy|energeti/.test(tags))                category = "energeticas";
        else if (/water|agua/.test(tags))                     category = "agua";
        else if (/juice|zumo|nectar/.test(tags))              category = "zumos";
        else if (/beer|wine|alcohol|spirit/.test(tags))       category = "alcohol";
        else if (/snack|chip|crisp|palomita/.test(tags))      category = "snacks";
        else if (/chocolate|candy|sweet|dulce/.test(tags))    category = "dulces";
        else if (/sauce|salsa|ketchup|mustard/.test(tags))    category = "salsas";
        else if (/oil|aceite|vinagre/.test(tags))             category = "aceites";
        else if (/spice|especia|herb/.test(tags))             category = "especias";
        openAdd({ barcode: bc, name, brand, category });
        if (name) notify(`✅ Encontrado: ${name}`, "info");
        else notify("Código encontrado — completa la ficha 📋","info");
      } else {
        openAdd({ barcode: bc });
        notify("Código nuevo — crea la ficha del producto 📋","info");
      }
    } catch {
      openAdd({ barcode: bc });
      notify("Sin conexión — crea la ficha manualmente 📋","info");
    }
  };

  // ── CRUD productos (ahora guarda expiry_date) ─────────────────────────
  const submitProduct = async () => {
    if (!form.name.trim()) return;
    const row = {
      name:form.name.trim(), barcode:form.barcode||"", price:parseFloat(form.price)||0,
      category:form.category, unit:form.unit, min_stock:parseInt(form.minStock)||1,
      emoji:form.emoji, supermarket:form.supermarket, brand:form.brand,
      brand_custom:form.brandCustom, pantry_id:pantryId,
      expiry_date: form.expiryDate || null,
      added_by: currentUser || null,
    };
    if (modal==="edit" && editId) {
      setProducts(prev => prev.map(p => p.id===editId ? {...p, ...rowToProduct({...row, id:editId, pantry_id:pantryId, stock:p.stock, created_at:p.createdAt})} : p));
      await supabase.from("products").update(row).eq("id", editId);
      notify("Producto actualizado ✓");
    } else {
      const id = Date.now().toString();
      await supabase.from("products").insert({ ...row, id, stock:0 });
      notify("Producto añadido al catálogo ✓");
    }
    closeModal();
  };

  const deleteProduct = async (id) => {
    setProducts(prev => prev.filter(p=>p.id!==id));
    await supabase.from("products").delete().eq("id", id);
    notify("Producto eliminado","err");
  };

  // ── Miembros ───────────────────────────────────────────────────────────
  const addMember = async () => {
    if (!memberName.trim()) return;
    const nm = { id:Date.now().toString(), pantry_id:pantryId, name:memberName.trim(), joined:new Date().toLocaleDateString("es-ES") };
    setMembers(prev => [...prev, rowToMember(nm)]);
    await supabase.from("members").insert(nm);
    setMemberName(""); notify(`${nm.name} añadido ✓`);
  };

  const deleteMember = async (id, name) => {
    setMembers(prev => prev.filter(m=>m.id!==id));
    await supabase.from("members").delete().eq("id", id);
    notify(`${name} eliminado`,"err");
  };

  // ── Modales ────────────────────────────────────────────────────────────
  const openAdd  = (pre={}) => { setForm({...defaultForm,...pre}); setEditId(null); setModal("add"); };
  const openEdit = (p) => {
    setForm({
      name:p.name, barcode:p.barcode||"", price:p.price?.toString()||"",
      category:p.category||"otros", unit:p.unit||"ud", minStock:p.minStock?.toString()||"2",
      emoji:p.emoji||"📦", supermarket:p.supermarket||"", brand:p.brand||"",
      brandCustom:p.brandCustom||"", expiryDate:p.expiryDate||"",
    });
    setEditId(p.id); setModal("edit");
  };
  const closeModal = () => { setModal(null); setEditId(null); };

  // ── Cámara ─────────────────────────────────────────────────────────────
  const openCamera = async () => {
    lockedRef.current=false; setCamError(""); setCamState("loading"); setCameraOpen(true);
    if (!("BarcodeDetector" in window)) { setCamError("Tu navegador no soporta el escáner nativo.\n\nUsa Chrome en Android o Safari 17+ en iPhone/iPad."); setCamState("error"); return; }
    try { detectorRef.current = new window.BarcodeDetector({formats:["ean_13","ean_8","code_128","code_39","upc_a","upc_e","qr_code","itf"]}); } catch { setCamError("No se pudo inicializar el detector."); setCamState("error"); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:"environment"},width:{ideal:1280},height:{ideal:720}}});
      streamRef.current=stream; setCamState("scanning");
    } catch (err) {
      setCamError(err.name==="NotAllowedError" ? "Permiso de cámara denegado.\n\nActívalo en los ajustes del navegador." : `No se pudo acceder a la cámara.\n\n${err.message}`);
      setCamState("error");
    }
  };
  useEffect(() => {
    if (camState==="scanning" && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().then(() => {
        const tick = async () => {
          if (!videoRef.current||!detectorRef.current||lockedRef.current) return;
          if (videoRef.current.readyState>=2) {
            try {
              const results = await detectorRef.current.detect(videoRef.current);
              if (results.length>0 && !lockedRef.current) {
                lockedRef.current=true; const code=results[0].rawValue;
                if (navigator.vibrate) navigator.vibrate([60,30,60]);
                stopCamera(); handleBarcodeInput(code); return;
              }
            } catch(_) {}
          }
          rafRef.current = requestAnimationFrame(tick);
        };
        rafRef.current = requestAnimationFrame(tick);
      }).catch(()=>{});
    }
  }, [camState]);
  const stopCamera = () => {
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current=null; }
    if (streamRef.current) { streamRef.current.getTracks().forEach(t=>t.stop()); streamRef.current=null; }
    setCameraOpen(false); setCamState("idle"); lockedRef.current=false;
  };

  // ── Lista de la compra (v2) ────────────────────────────────────────────
  const autoShopItems = products.filter(p => (p.stock||0) < (p.minStock||1));

  const addShopItem = async () => {
    if (!shopInput.trim()) return;
    const item = { id: Date.now().toString(), pantry_id: pantryId, name: shopInput.trim(), emoji: "📦" };
    setManualShopItems(prev => [...prev, rowToShopItem(item)]);
    await supabase.from("shopping_list").insert(item);
    setShopInput(""); notify("Añadido a la lista ✓");
  };

  const deleteShopItem = async (id) => {
    setManualShopItems(prev => prev.filter(i => i.id !== id));
    await supabase.from("shopping_list").delete().eq("id", id);
  };

  const clearShopList = async () => {
    if (!confirm("¿Limpiar toda la lista manual?")) return;
    setManualShopItems([]);
    await supabase.from("shopping_list").delete().eq("pantry_id", pantryId);
    notify("Lista limpiada");
  };

  const shareWhatsApp = () => {
    const lines = [`🛒 *Lista de la compra — ${pantryName}*\n`];
    if (autoShopItems.length > 0) {
      lines.push("*Necesito reponer:*");
      autoShopItems.forEach(p => {
        const s = p.stock||0;
        lines.push(`• ${p.emoji} ${p.name} (${s===0?"agotado":`quedan ${s} ${p.unit}`})`);
      });
    }
    if (manualShopItems.length > 0) {
      if (autoShopItems.length > 0) lines.push("");
      lines.push("*Otras cosas:*");
      manualShopItems.forEach(i => lines.push(`• ${i.emoji} ${i.name}`));
    }
    if (autoShopItems.length===0 && manualShopItems.length===0) { notify("La lista está vacía","info"); return; }
    window.open(`https://wa.me/?text=${encodeURIComponent(lines.join("\n"))}`, "_blank");
  };

  // ── Recetas con IA (v2) ───────────────────────────────────────────────
  const fetchRecipes = async () => {
    setRecipesLoading(true); setRecipes([]);
    const expiring = products
      .filter(p => {
        if (!p.expiryDate || (p.stock||0) <= 0) return false;
        const d = daysUntilExpiry(p.expiryDate);
        return d !== null && d <= 7;
      })
      .sort((a,b) => daysUntilExpiry(a.expiryDate) - daysUntilExpiry(b.expiryDate))
      .slice(0, 8)
      .map(p => `${p.name}${p.brandCustom||p.brand ? ` (${p.brandCustom||p.brand})` : ""}: ${p.stock} ${p.unit}`);

    if (expiring.length === 0) {
      notify("No hay productos con caducidad próxima y stock > 0","info");
      setRecipesLoading(false); return;
    }

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1200,
          messages: [{
            role: "user",
            content: `Soy español. Tengo estos ingredientes que caducan en los próximos 7 días: ${expiring.join(", ")}. Sugiere exactamente 3 recetas sencillas y cotidianas que los aprovechen al máximo, priorizando los que vencen antes. Cada receta debe ser realista para una cena entre semana. Responde SOLO con JSON válido sin ningún texto adicional, usando este formato: {"recetas":[{"nombre":"","tiempo":"15 min","ingredientes":[""],"pasos":[""]}]}`
          }]
        })
      });
      const data = await response.json();
      const text = data.content?.[0]?.text || "";
      const clean = text.replace(/```json|```/g,"").trim();
      const parsed = JSON.parse(clean);
      setRecipes(parsed.recetas || []);
      if ((parsed.recetas||[]).length === 0) notify("No se pudieron generar recetas","err");
    } catch(e) {
      notify("Error al conectar con la IA","err");
    }
    setRecipesLoading(false);
  };

  // ── Cálculos para estadísticas ─────────────────────────────────────────
  const filtered = products
    .filter(p => (p.name.toLowerCase().includes(search.toLowerCase())||(p.barcode||"").includes(search))&&(cat==="todas"||p.category===cat))
    .sort((a,b) => sortBy==="name" ? a.name.localeCompare(b.name) : sortBy==="stock" ? (a.stock||0)-(b.stock||0) : ((a.stock||0)-(a.minStock||1))-((b.stock||0)-(b.minStock||1)));

  const expiringCount = products.filter(p => {
    if (!p.expiryDate) return false;
    const d = daysUntilExpiry(p.expiryDate);
    return d !== null && d <= 7;
  }).length;

  const stats = {
    total:    products.length,
    expiring: expiringCount,
    low:      products.filter(p=>(p.stock||0)>0&&(p.stock||0)<(p.minStock||1)).length,
    out:      products.filter(p=>(p.stock||0)===0).length,
  };

  // ── Datos para pestaña Caduca ─────────────────────────────────────────
  const withExpiry = products.filter(p => p.expiryDate).sort((a,b)=>{
    const da = daysUntilExpiry(a.expiryDate), db = daysUntilExpiry(b.expiryDate);
    return (da??999)-(db??999);
  });
  const expiredProds  = withExpiry.filter(p => { const d=daysUntilExpiry(p.expiryDate); return d!==null && d<0; });
  const thisWeekProds = withExpiry.filter(p => { const d=daysUntilExpiry(p.expiryDate); return d!==null && d>=0 && d<=7; });
  const soonProds     = withExpiry.filter(p => { const d=daysUntilExpiry(p.expiryDate); return d!==null && d>7 && d<=30; });

  // ═══════════════════════════════════════════════════════════════════════
  // CSS
  // ═══════════════════════════════════════════════════════════════════════
  const CSS = `
    @import url('https://fonts.googleapis.com/css2?family=Lora:wght@500;700&family=Nunito:wght@400;500;600;700&display=swap');
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    html,body{height:100%;background:#F7F3EC} #root{height:100%}
    .app{min-height:100svh;background:#F7F3EC;font-family:'Nunito',sans-serif;color:#1C2B10;padding-bottom:3rem}

    .setup-bg{min-height:100svh;background:linear-gradient(160deg,#1a3a09 0%,#2D5016 50%,#3d6b1e 100%);display:flex;align-items:center;justify-content:center;padding:1.5rem}
    .setup-card{background:white;border-radius:24px;padding:2rem;width:100%;max-width:400px;box-shadow:0 24px 64px rgba(0,0,0,.35)}
    .setup-logo{font-family:'Lora',serif;font-size:2rem;font-weight:700;color:#2D5016;text-align:center;margin-bottom:0.3rem}
    .setup-logo em{color:#7FB069;font-style:normal}
    .setup-sub{text-align:center;font-size:0.83rem;color:#6B7260;margin-bottom:1.75rem}
    .setup-tabs{display:flex;background:#F3F4F6;border-radius:12px;padding:4px;margin-bottom:1.5rem;gap:4px}
    .setup-tab{flex:1;padding:0.55rem;border:none;background:transparent;border-radius:9px;cursor:pointer;font-family:'Nunito',sans-serif;font-size:0.85rem;font-weight:600;color:#6B7260;transition:all .2s}
    .setup-tab.on{background:white;color:#2D5016;box-shadow:0 2px 8px rgba(0,0,0,.1)}
    .setup-label{font-size:0.78rem;font-weight:700;color:#374151;margin-bottom:0.35rem;display:block}
    .setup-input{width:100%;padding:0.7rem 0.9rem;border:1.5px solid #D1D5DB;border-radius:10px;font-family:'Nunito',sans-serif;font-size:0.95rem;outline:none;margin-bottom:0.85rem;text-transform:uppercase;letter-spacing:.1em}
    .setup-input:focus{border-color:#2D5016} .setup-input.normal{text-transform:none;letter-spacing:normal}
    .setup-btn{width:100%;padding:0.8rem;background:#2D5016;color:white;border:none;border-radius:12px;font-family:'Nunito',sans-serif;font-weight:700;font-size:1rem;cursor:pointer;transition:background .2s}
    .setup-btn:hover{background:#3C6B1E} .setup-btn:disabled{opacity:.6;cursor:not-allowed}
    .setup-err{background:#FEE2E2;color:#B91C1C;border-radius:8px;padding:0.6rem 0.85rem;font-size:0.82rem;margin-bottom:0.85rem}
    .setup-hint{font-size:0.75rem;color:#6B7260;text-align:center;margin-top:1rem;line-height:1.6}
    .setup-hint strong{color:#2D5016}

    .hdr{background:#2D5016;padding:0.9rem 1.25rem 0;position:sticky;top:0;z-index:100;box-shadow:0 2px 12px rgba(0,0,0,.18)}
    .hdr-top{display:flex;justify-content:space-between;align-items:center;margin-bottom:0.7rem;gap:.5rem}
    .logo{font-family:'Lora',serif;font-size:1.25rem;font-weight:700;color:#E8D9A8;flex-shrink:0}
    .logo em{color:#9DC183;font-style:normal}
    .hdr-right{display:flex;align-items:center;gap:0.45rem;flex-shrink:0}
    .sync-dot{width:6px;height:6px;border-radius:50%;background:#4CAF50;transition:background .3s;flex-shrink:0}
    .sync-dot.syncing{background:#F59E0B;animation:blink .6s infinite}
    @keyframes blink{0%,100%{opacity:1}50%{opacity:.3}}
    .sync-label{font-size:0.68rem;color:#9DC183;white-space:nowrap}
    .share-btn{padding:0.28rem 0.6rem;background:rgba(255,255,255,.15);border:1px solid rgba(255,255,255,.25);border-radius:8px;color:#E8D9A8;font-family:'Nunito',sans-serif;font-size:0.7rem;font-weight:700;cursor:pointer;white-space:nowrap}
    .share-btn:hover{background:rgba(255,255,255,.25)}
    .tabs{display:flex;overflow-x:auto}
    .tab{flex:1;padding:0.5rem 0.3rem 0.7rem;border:none;background:transparent;cursor:pointer;font-family:'Nunito',sans-serif;font-size:0.74rem;font-weight:600;color:#7FAF63;border-bottom:2.5px solid transparent;transition:all .2s;white-space:nowrap;min-width:0}
    .tab.on{color:#E8D9A8;border-bottom-color:#E8D9A8}
    .tab-badge{display:inline-block;background:#E57C1A;color:white;font-size:.6rem;font-weight:700;border-radius:99px;padding:.06rem .38rem;margin-left:.3rem;vertical-align:middle}

    .sbar{display:flex;background:#EDE8DE;border-bottom:1px solid #DDD6C8}
    .sitem{flex:1;display:flex;flex-direction:column;align-items:center;padding:0.6rem 0.5rem;border-right:1px solid #DDD6C8;cursor:pointer;transition:background .15s}
    .sitem:last-child{border-right:none}
    .sitem:hover{background:#E4DFD5}
    .snum{font-family:'Lora',serif;font-size:1.4rem;font-weight:700}
    .slabel{font-size:0.67rem;color:#6B7260;text-align:center}
    .s-green{color:#2D6A16}.s-amber{color:#B07D10}.s-red{color:#C02020}.s-gray{color:#374151}.s-orange{color:#C45A00}
    .content{padding:1.1rem 1.1rem 0;max-width:920px;margin:0 auto}

    .bc-strip{background:#ECF5E4;border:1.5px dashed #7FB069;border-radius:12px;padding:.75rem .9rem;margin-bottom:1rem}
    .bc-label{font-size:.73rem;font-weight:700;color:#2D5016;margin-bottom:.5rem}
    .bc-row{display:flex;gap:.5rem;align-items:center}
    .bc-in{flex:1;padding:.5rem .75rem;border:1.5px solid #B8D0A0;border-radius:9px;font-family:'Nunito',sans-serif;font-size:.88rem;outline:none;background:white;min-width:0}
    .bc-in:focus{border-color:#2D5016}
    .cam-btn{padding:.5rem .9rem;background:#2D5016;color:white;border:none;border-radius:9px;font-family:'Nunito',sans-serif;font-weight:700;font-size:.85rem;cursor:pointer;white-space:nowrap;transition:background .2s;flex-shrink:0}
    .cam-btn:hover{background:#3C6B1E}
    .ok-btn{padding:.5rem .85rem;background:#4D7C30;color:white;border:none;border-radius:9px;font-family:'Nunito',sans-serif;font-weight:700;font-size:.85rem;cursor:pointer;flex-shrink:0}
    .bc-hint{font-size:.68rem;color:#4D7C30;margin-top:.4rem}
    .srow{display:flex;gap:.6rem;margin-bottom:.85rem;align-items:center;flex-wrap:wrap}
    .sin{flex:1;min-width:0;padding:.55rem .9rem;border:1.5px solid #D4CEBC;border-radius:10px;background:white;font-family:'Nunito',sans-serif;font-size:.88rem;outline:none}
    .sin:focus{border-color:#2D5016}
    .sort-sel{padding:.55rem .6rem;border:1.5px solid #D4CEBC;border-radius:10px;background:white;font-family:'Nunito',sans-serif;font-size:.82rem;outline:none;cursor:pointer;flex-shrink:0}
    .btn-new{padding:.55rem 1.1rem;background:#2D5016;color:white;border:none;border-radius:10px;font-family:'Nunito',sans-serif;font-weight:700;font-size:.85rem;cursor:pointer;white-space:nowrap;flex-shrink:0}
    .btn-new:hover{background:#3C6B1E}
    @media(max-width:400px){.srow{flex-wrap:wrap}.sin{width:100%}.sort-sel,.btn-new{flex:1}}
    .chips{display:flex;gap:.4rem;margin-bottom:1rem;overflow-x:auto;padding-bottom:2px}
    .chip{padding:.3rem .85rem;border-radius:20px;border:1.5px solid #D4CEBC;background:white;cursor:pointer;font-size:.78rem;font-family:'Nunito',sans-serif;font-weight:600;white-space:nowrap;transition:all .18s}
    .chip.on{background:#2D5016;color:white;border-color:#2D5016}

    .pgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:.65rem}
    .pcard{background:white;border-radius:12px;padding:.75rem;border:1.5px solid #EAE4D8;transition:all .2s;position:relative}
    .pcard:hover{transform:translateY(-1px);box-shadow:0 4px 18px rgba(0,0,0,.08)}
    .pcard.out{border-style:dashed;opacity:.62}
    .pcard.low{border-color:#D4860A}
    .pcard.exp-crit{border-color:#FECACA !important;border-width:2px;border-style:solid !important;opacity:1 !important}
    .pcard.exp-warn{border-color:#FDE68A;border-width:2px}
    .pcard-badge{position:absolute;top:.45rem;right:.45rem;font-size:.6rem;padding:.14rem .42rem;border-radius:7px;font-weight:700}
    .badge-out{background:#FEE2E2;color:#B91C1C} .badge-low{background:#FEF3C7;color:#92400E}
    .pcard-top{cursor:pointer;padding-bottom:.4rem;border-bottom:1px solid #F0EDE6;margin-bottom:.4rem;-webkit-tap-highlight-color:transparent;position:relative}
    .pcard-top::after{content:"✎ editar";position:absolute;bottom:.1rem;right:0;font-size:.55rem;color:#C4BFB4;opacity:0;transition:opacity .2s}
    .pcard:hover .pcard-top::after{opacity:1}
    .pcard-top:active{opacity:.75}
    .p-emoji{font-size:1.6rem;margin-bottom:.2rem}
    .p-name{font-weight:700;font-size:.85rem;line-height:1.25;margin-bottom:.1rem}
    .p-cat{font-size:.65rem;color:#6B7260}
    .p-price{font-size:.67rem;color:#B07D10;font-weight:700;margin-top:.05rem}
    .exp-badge{font-size:.6rem;font-weight:700;padding:.12rem .4rem;border-radius:6px;display:inline-block;margin-top:.2rem}
    .exp-red{background:#FEE2E2;color:#B91C1C}
    .exp-amber{background:#FEF3C7;color:#92400E}
    .exp-green{background:#D1FAE5;color:#065F46}
    .sc{display:flex;align-items:center;justify-content:space-between;margin-top:.35rem}
    .sbtn{width:30px;height:30px;border-radius:8px;border:none;cursor:pointer;font-size:1rem;font-weight:800;display:flex;align-items:center;justify-content:center;transition:all .15s}
    .sm{background:#FEE2E2;color:#DC2626}.sm:hover{background:#DC2626;color:white}
    .sp{background:#DCFCE7;color:#15803D}.sp:hover{background:#15803D;color:white}
    .snum-big{font-family:'Lora',serif;font-size:1.35rem;font-weight:700;color:#2D5016;text-align:center;min-width:2rem}
    .sunit{font-size:.6rem;color:#6B7260;text-align:center}

    .citem{background:white;border-radius:12px;padding:.9rem 1rem;border:1.5px solid #EAE4D8;display:flex;align-items:center;gap:.85rem;margin-bottom:.65rem}
    .citem:hover{border-color:#B8D0A0}
    .c-emoji{font-size:1.7rem;width:38px;text-align:center;flex-shrink:0}
    .c-info{flex:1;min-width:0}
    .c-name{font-weight:700;font-size:.93rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .c-meta{font-size:.73rem;color:#6B7260;display:flex;gap:.6rem;flex-wrap:wrap;margin-top:.15rem}
    .c-stock{font-family:'Lora',serif;font-weight:700;color:#2D5016;font-size:1.05rem;min-width:2.5rem;text-align:center}
    .c-unit{font-size:.65rem;color:#6B7260;text-align:center}
    .c-acts{display:flex;gap:.4rem;flex-shrink:0}
    .ib{width:30px;height:30px;border-radius:7px;border:none;cursor:pointer;font-size:.82rem;display:flex;align-items:center;justify-content:center;transition:all .15s}
    .ib-e{background:#EFF6FF;color:#2563EB}.ib-e:hover{background:#2563EB;color:white}
    .ib-d{background:#FEF2F2;color:#DC2626}.ib-d:hover{background:#DC2626;color:white}

    .mgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(155px,1fr));gap:.85rem;margin-bottom:1.25rem}
    .mcard{background:white;border-radius:14px;padding:1.1rem;text-align:center;border:1.5px solid #EAE4D8}
    .m-avatar{width:48px;height:48px;border-radius:50%;background:linear-gradient(135deg,#2D5016,#7FB069);color:white;font-family:'Lora',serif;font-size:1.25rem;font-weight:700;display:flex;align-items:center;justify-content:center;margin:0 auto .65rem}
    .m-name{font-weight:700;font-size:.9rem} .m-joined{font-size:.7rem;color:#6B7260;margin-bottom:.3rem}
    .m-del{font-size:.7rem;color:#DC2626;cursor:pointer;border:none;background:none;font-family:'Nunito',sans-serif;font-weight:600}
    .info-box{background:#ECF5E4;border-radius:12px;padding:1.1rem;border:1.5px solid #B8D0A0;margin-bottom:1rem}
    .info-title{font-weight:700;font-size:.88rem;color:#2D5016;margin-bottom:.4rem}
    .info-text{font-size:.8rem;color:#3D6B1C;line-height:1.65}
    .code-box{background:#2D5016;border-radius:10px;padding:.75rem 1rem;display:flex;align-items:center;justify-content:space-between;margin-top:.75rem}
    .code-val{font-family:'Lora',serif;font-size:1.5rem;font-weight:700;color:#E8D9A8;letter-spacing:.15em}
    .copy-btn{padding:.4rem .85rem;background:rgba(255,255,255,.2);border:1px solid rgba(255,255,255,.3);border-radius:8px;color:white;font-family:'Nunito',sans-serif;font-weight:700;font-size:.78rem;cursor:pointer}
    .copy-btn:hover{background:rgba(255,255,255,.3)}
    .leave-btn{width:100%;padding:.6rem;background:#FEE2E2;color:#B91C1C;border:none;border-radius:10px;font-family:'Nunito',sans-serif;font-weight:600;font-size:.85rem;cursor:pointer}

    .share-ov{position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:250;display:flex;align-items:center;justify-content:center;padding:1rem}
    .share-card{background:white;border-radius:20px;padding:1.75rem;width:100%;max-width:340px;text-align:center}
    .share-title{font-family:'Lora',serif;font-size:1.2rem;font-weight:700;color:#2D5016;margin-bottom:.35rem}
    .share-sub{font-size:.8rem;color:#6B7260;margin-bottom:1.25rem;line-height:1.55}
    .share-code{font-family:'Lora',serif;font-size:2.8rem;font-weight:700;color:#2D5016;letter-spacing:.2em;background:#ECF5E4;border-radius:14px;padding:.75rem 1.5rem;margin-bottom:1.1rem;display:inline-block}
    .share-copy{width:100%;padding:.7rem;background:#2D5016;color:white;border:none;border-radius:12px;font-family:'Nunito',sans-serif;font-weight:700;font-size:.95rem;cursor:pointer;margin-bottom:.6rem}
    .share-close{width:100%;padding:.6rem;background:#F3F4F6;color:#374151;border:none;border-radius:12px;font-family:'Nunito',sans-serif;font-weight:600;font-size:.9rem;cursor:pointer}

    .cam-ov{position:fixed;inset:0;background:rgba(0,0,0,.92);z-index:300;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:1.2rem}
    .cam-box{width:100%;max-width:420px}
    .cam-hdr{display:flex;justify-content:space-between;align-items:center;margin-bottom:.8rem}
    .cam-title{font-family:'Lora',serif;font-size:1.15rem;font-weight:700;color:white}
    .cam-x{width:36px;height:36px;border-radius:50%;border:none;background:rgba(255,255,255,.15);color:white;font-size:1rem;cursor:pointer;display:flex;align-items:center;justify-content:center}
    .cam-x:hover{background:rgba(255,255,255,.25)}
    .cam-vp{width:100%;aspect-ratio:4/3;background:#111;border-radius:16px;overflow:hidden;position:relative;border:2px solid rgba(255,255,255,.1)}
    .cam-video{width:100%;height:100%;object-fit:cover;display:block}
    .cam-overlay{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;pointer-events:none}
    .cam-frame{width:70%;height:38%;border:2.5px solid rgba(255,255,255,.8);border-radius:10px;position:relative;box-shadow:0 0 0 2000px rgba(0,0,0,.38)}
    .cam-scan-line{position:absolute;left:0;right:0;height:2.5px;background:linear-gradient(90deg,transparent,#4CAF50,transparent);animation:scanMove 2s ease-in-out infinite}
    @keyframes scanMove{0%{top:8%;opacity:0}15%{opacity:1}85%{opacity:1}100%{top:92%;opacity:0}}
    .cam-tip{text-align:center;color:rgba(255,255,255,.6);font-size:.78rem;font-family:'Nunito',sans-serif;margin-top:.85rem;line-height:1.6}
    .cam-loading{display:flex;flex-direction:column;align-items:center;gap:.75rem;color:rgba(255,255,255,.7);font-family:'Nunito',sans-serif;font-size:.88rem;padding:3rem 0;background:#111;border-radius:16px}
    .spinner{width:34px;height:34px;border:3px solid rgba(255,255,255,.15);border-top-color:#4CAF50;border-radius:50%;animation:spin .75s linear infinite}
    @keyframes spin{to{transform:rotate(360deg)}}
    .cam-err{background:#1a0000;border:1.5px solid #7f1d1d;border-radius:14px;padding:1.4rem;color:#fca5a5;font-family:'Nunito',sans-serif;font-size:.85rem;line-height:1.65;text-align:center;white-space:pre-line}
    .cam-err strong{color:white;font-size:.95rem;display:block;margin-bottom:.5rem}
    .cam-err-btn{margin-top:1rem;padding:.55rem 1.5rem;background:rgba(255,255,255,.12);color:white;border:1px solid rgba(255,255,255,.2);border-radius:9px;font-family:'Nunito',sans-serif;font-weight:600;font-size:.85rem;cursor:pointer}

    .ov{position:fixed;inset:0;background:rgba(0,0,0,.42);z-index:200;display:flex;align-items:center;justify-content:center;padding:1rem}
    .mod{background:white;border-radius:18px;padding:1.6rem;width:100%;max-width:460px;max-height:92svh;overflow-y:auto}
    .mod-title{font-family:'Lora',serif;font-size:1.3rem;font-weight:700;color:#2D5016;margin-bottom:1.15rem}
    .fg{margin-bottom:.9rem} .fl{font-size:.78rem;font-weight:700;color:#374151;margin-bottom:.3rem;display:block}
    .fi{width:100%;padding:.6rem .85rem;border:1.5px solid #D1D5DB;border-radius:9px;font-family:'Nunito',sans-serif;font-size:.88rem;outline:none}
    .fi:focus{border-color:#2D5016}
    .fsel{width:100%;padding:.6rem .85rem;border:1.5px solid #D1D5DB;border-radius:9px;font-family:'Nunito',sans-serif;font-size:.88rem;outline:none;background:white;cursor:pointer}
    .fr{display:grid;grid-template-columns:1fr 1fr;gap:.65rem}
    .ep{display:flex;flex-wrap:wrap;gap:.35rem;margin-top:.3rem}
    .eo{width:34px;height:34px;border-radius:7px;border:1.5px solid #E5E7EB;background:white;cursor:pointer;font-size:1.1rem;display:flex;align-items:center;justify-content:center;transition:all .15s}
    .eo.on{border-color:#2D5016;background:#ECF5E4}
    .macts{display:flex;gap:.6rem;margin-top:1.35rem}
    .bp{flex:1;padding:.7rem;background:#2D5016;color:white;border:none;border-radius:10px;cursor:pointer;font-family:'Nunito',sans-serif;font-weight:700;font-size:.92rem}
    .bp:hover{background:#3C6B1E}
    .bs{padding:.7rem 1.1rem;background:#F3F4F6;color:#374151;border:none;border-radius:10px;cursor:pointer;font-family:'Nunito',sans-serif;font-weight:600;font-size:.92rem}
    .bd{padding:.7rem .9rem;background:#FEE2E2;color:#DC2626;border:none;border-radius:10px;cursor:pointer;font-family:'Nunito',sans-serif;font-weight:600;font-size:.92rem}

    .toast{position:fixed;bottom:1.5rem;left:50%;transform:translateX(-50%);padding:.7rem 1.4rem;border-radius:12px;font-family:'Nunito',sans-serif;font-size:.88rem;font-weight:700;z-index:400;box-shadow:0 4px 20px rgba(0,0,0,.18);animation:slideUp .3s ease;white-space:nowrap}
    .t-ok{background:#2D5016;color:white}.t-err{background:#B91C1C;color:white}.t-info{background:#1E40AF;color:white}
    @keyframes slideUp{from{opacity:0;transform:translateX(-50%) translateY(16px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}
    .empty{text-align:center;padding:2.5rem 1rem;color:#6B7260}
    .empty-ico{font-size:2.8rem;margin-bottom:.75rem} .empty-t{font-size:.95rem;font-weight:600;margin-bottom:.35rem;color:#374131} .empty-s{font-size:.8rem}
    .stitle{font-family:'Lora',serif;font-size:1.1rem;font-weight:700;color:#2D5016;margin-bottom:.85rem}
    .data-loading{display:flex;align-items:center;justify-content:center;padding:3rem;gap:.75rem;color:#6B7260;font-size:.9rem}
    ::-webkit-scrollbar{width:5px;height:5px} ::-webkit-scrollbar-thumb{background:#C8D0B0;border-radius:3px}

    /* ── v2: Lista de la compra ──────────────────────────────────────────── */
    .shop-sect{margin-bottom:1.5rem}
    .shop-hdr{display:flex;justify-content:space-between;align-items:center;margin-bottom:.75rem}
    .shop-sect-title{font-family:'Lora',serif;font-size:1rem;font-weight:700;color:#2D5016}
    .shop-count{font-size:.75rem;font-weight:700;background:#ECF5E4;color:#2D5016;border-radius:99px;padding:.12rem .55rem;margin-left:.5rem}
    .shop-clear{font-size:.75rem;color:#9CA3AF;border:none;background:none;cursor:pointer;font-family:'Nunito',sans-serif;padding:0}
    .shop-clear:hover{color:#B91C1C}
    .shop-item{background:white;border-radius:11px;border:1.5px solid #EAE4D8;padding:.72rem .95rem;display:flex;align-items:center;gap:.75rem;margin-bottom:.48rem;transition:border-color .15s}
    .shop-item:hover{border-color:#B8D0A0}
    .shop-emoji{font-size:1.5rem;flex-shrink:0}
    .shop-info{flex:1;min-width:0}
    .shop-name{font-weight:600;font-size:.9rem;color:#1C2B10;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .shop-sub{font-size:.7rem;color:#6B7260;margin-top:.1rem}
    .shop-sm{font-size:.65rem;font-weight:700;padding:.1rem .38rem;border-radius:5px;display:inline-block;margin-top:.15rem}
    .shop-buy{padding:.38rem .8rem;background:#DCFCE7;color:#15803D;border:none;border-radius:7px;font-family:'Nunito',sans-serif;font-weight:700;font-size:.78rem;cursor:pointer;white-space:nowrap;flex-shrink:0;transition:all .15s}
    .shop-buy:hover{background:#15803D;color:white}
    .shop-del-btn{width:26px;height:26px;border-radius:7px;border:none;background:#FEF2F2;color:#DC2626;cursor:pointer;font-size:.8rem;flex-shrink:0;display:flex;align-items:center;justify-content:center;transition:all .15s}
    .shop-del-btn:hover{background:#DC2626;color:white}
    .shop-add-row{display:flex;gap:.5rem;background:#ECF5E4;border-radius:11px;padding:.65rem .85rem;margin-top:.75rem;border:1.5px dashed #B8D0A0}
    .shop-add-in{flex:1;border:none;background:transparent;font-family:'Nunito',sans-serif;font-size:.9rem;outline:none;color:#1C2B10}
    .shop-add-in::placeholder{color:#9CA3AF}
    .shop-add-btn{padding:.42rem .9rem;background:#2D5016;color:white;border:none;border-radius:8px;font-family:'Nunito',sans-serif;font-weight:700;font-size:.82rem;cursor:pointer;flex-shrink:0}
    .shop-add-btn:hover{background:#3C6B1E}
    .wa-btn{width:100%;padding:.75rem;background:#25D366;color:white;border:none;border-radius:12px;font-family:'Nunito',sans-serif;font-weight:700;font-size:.92rem;cursor:pointer;margin-top:.75rem;display:flex;align-items:center;justify-content:center;gap:.5rem;transition:background .2s}
    .wa-btn:hover{background:#128C7E}
    .shop-empty{text-align:center;padding:1.5rem 1rem;color:#6B7260}
    .shop-empty-ico{font-size:2rem;margin-bottom:.45rem}
    .shop-empty-t{font-size:.85rem;font-weight:600;color:#374131;margin-bottom:.25rem}
    .shop-empty-s{font-size:.75rem}
    .shop-all-ok{background:#ECF5E4;border-radius:12px;padding:1.25rem;text-align:center;border:1.5px solid #B8D0A0;margin-bottom:1rem}
    .shop-all-ok-ico{font-size:2rem;margin-bottom:.4rem}
    .shop-all-ok-t{font-size:.92rem;font-weight:700;color:#2D5016;margin-bottom:.2rem}
    .shop-all-ok-s{font-size:.78rem;color:#4D7C30}

    /* ── v2: Caducidades ─────────────────────────────────────────────────── */
    .cad-recipe-box{background:#ECF5E4;border-radius:14px;padding:1.1rem;margin-bottom:1.25rem;border:1.5px solid #B8D0A0}
    .cad-recipe-title{font-family:'Lora',serif;font-size:.95rem;font-weight:700;color:#2D5016;margin-bottom:.35rem}
    .cad-recipe-sub{font-size:.77rem;color:#4D7C30;margin-bottom:.85rem;line-height:1.55}
    .cad-recipe-btn{width:100%;padding:.72rem;background:#2D5016;color:#E8D9A8;border:none;border-radius:10px;font-family:'Nunito',sans-serif;font-weight:700;font-size:.9rem;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:.5rem;transition:background .2s}
    .cad-recipe-btn:hover{background:#3C6B1E}
    .cad-recipe-btn:disabled{opacity:.6;cursor:default}
    .rec-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:.85rem;margin-top:.85rem}
    .rec-card{background:white;border-radius:12px;padding:1rem;border:1.5px solid #C8D8B8}
    .rec-name{font-family:'Lora',serif;font-weight:700;font-size:.98rem;color:#2D5016;margin-bottom:.2rem}
    .rec-time{font-size:.72rem;color:#6B7260;margin-bottom:.55rem;display:flex;align-items:center;gap:.3rem}
    .rec-section-label{font-size:.7rem;font-weight:700;color:#374151;text-transform:uppercase;letter-spacing:.05em;margin-bottom:.3rem}
    .rec-ings{font-size:.78rem;color:#374151;margin-bottom:.55rem;line-height:1.55}
    .rec-steps{padding-left:1rem;font-size:.78rem;color:#374151;line-height:1.7}
    .rec-steps li{margin-bottom:.18rem}
    .rec-spinner{display:flex;align-items:center;justify-content:center;gap:.6rem;padding:1rem;font-size:.85rem;color:#4D7C30;font-family:'Nunito',sans-serif}
    .cad-group{margin-bottom:1.35rem}
    .cad-gtitle{font-size:.72rem;font-weight:700;text-transform:uppercase;letter-spacing:.06em;padding:.32rem .72rem;border-radius:7px;display:inline-block;margin-bottom:.72rem}
    .cg-red{background:#FEE2E2;color:#B91C1C}
    .cg-amber{background:#FEF3C7;color:#92400E}
    .cg-green{background:#D1FAE5;color:#065F46}
    .cad-item{background:white;border-radius:12px;border:1.5px solid #EAE4D8;padding:.8rem .95rem;display:flex;align-items:center;gap:.8rem;margin-bottom:.5rem;transition:border-color .15s}
    .cad-item:hover{box-shadow:0 2px 10px rgba(0,0,0,.06)}
    .ci-red{border-color:#FECACA}
    .ci-amber{border-color:#FDE68A}
    .cad-emoji{font-size:1.65rem;flex-shrink:0}
    .cad-info{flex:1;min-width:0}
    .cad-name{font-weight:700;font-size:.9rem;margin-bottom:.1rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .cad-days{font-size:.75rem;font-weight:700;margin-bottom:.06rem}
    .cd-red{color:#B91C1C}.cd-amber{color:#92400E}.cd-green{color:#065F46}
    .cad-stock{font-size:.7rem;color:#6B7260}
    .cad-edit{padding:.32rem .65rem;background:#F3F4F6;border:none;border-radius:7px;cursor:pointer;font-size:.72rem;color:#374151;font-family:'Nunito',sans-serif;flex-shrink:0;transition:background .15s}
    .cad-edit:hover{background:#E5E7EB}
    .cad-empty{text-align:center;padding:2.5rem 1rem;color:#6B7260}
    .cad-empty-ico{font-size:2.5rem;margin-bottom:.7rem}
    .cad-empty-t{font-size:.92rem;font-weight:600;color:#374131;margin-bottom:.35rem}
    .cad-empty-s{font-size:.8rem;line-height:1.55}
  `;

  // ═══════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════
  if (screen==="loading") return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100svh",background:"#F7F3EC",fontFamily:"Georgia,serif",color:"#2D5016",fontSize:"1.1rem",gap:"0.75rem"}}>
      <span style={{animation:"spin 1s linear infinite",display:"inline-block"}}>🌿</span> Cargando…
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (screen==="setup") return (
    <>
      <style>{CSS}</style>
      <div className="setup-bg">
        <div className="setup-card">
          <div className="setup-logo">mi<em>Despensa</em></div>
          <div className="setup-sub">Control de stock compartido para tu hogar</div>
          <div className="setup-tabs">
            <button className={`setup-tab ${setupMode==="create"?"on":""}`} onClick={()=>{setSetupMode("create");setSetupError("");}}>🏡 Crear despensa</button>
            <button className={`setup-tab ${setupMode==="join"?"on":""}`}   onClick={()=>{setSetupMode("join");setSetupError("");}}>🔑 Unirme a una</button>
          </div>
          {setupError && <div className="setup-err">⚠️ {setupError}</div>}
          {setupMode==="create" ? (
            <>
              <label className="setup-label">Nombre de tu despensa (opcional)</label>
              <input className="setup-input normal" placeholder="Ej: Casa familiar, Piso compartido…" value={setupName} onChange={e=>setSetupName(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleCreate()} />
              <button className="setup-btn" onClick={handleCreate} disabled={setupLoading}>{setupLoading?"Creando…":"Crear mi despensa →"}</button>
              <div className="setup-hint">Se generará un código único que podrás compartir con tu familia o compañeros de piso.</div>
            </>
          ) : (
            <>
              <label className="setup-label">Código de la despensa</label>
              <input className="setup-input" placeholder="XXXXXX" maxLength={6} value={setupCode} onChange={e=>setSetupCode(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleJoin()} />
              <button className="setup-btn" onClick={handleJoin} disabled={setupLoading}>{setupLoading?"Buscando…":"Unirme →"}</button>
              <div className="setup-hint">Pide el código a quien creó la despensa. Lo encontrarán en la pestaña <strong>Grupo</strong>.</div>
            </>
          )}
        </div>
      </div>
    </>
  );

  return (
    <>
      <style>{CSS}</style>
      <div className="app">

        {/* ── HEADER ──────────────────────────────────────────────────── */}
        <div className="hdr">
          <div className="hdr-top">
            <div className="logo">mi<em>Despensa</em></div>
            <div className="hdr-right">
              <div className={`sync-dot ${syncing?"syncing":""}`}/>
              <span className="sync-label">{syncing?"Sincronizando…":"En tiempo real"}</span>
              {currentUser&&<span style={{fontSize:".68rem",color:"#9DC183",fontWeight:700,whiteSpace:"nowrap"}}>👤 {currentUser}</span>}
              <button className="share-btn" onClick={()=>setShowShare(true)}>🔑 Compartir</button>
            </div>
          </div>
          <div className="tabs">
            {[
              ["despensa","🥑 Despensa",null],
              ["catalogo","📋 Catálogo",null],
              ["compra",  "🛒 Compra",   autoShopItems.length+manualShopItems.length||null],
              ["caduca",  "📅 Caduca",   expiringCount||null],
              ["grupo",   "👥 Grupo",    null],
            ].map(([id,l,badge])=>(
              <button key={id} className={`tab ${tab===id?"on":""}`} onClick={()=>setTab(id)}>
                {l}{badge?<span className="tab-badge">{badge}</span>:null}
              </button>
            ))}
          </div>
        </div>

        {/* ── STATS BAR ───────────────────────────────────────────────── */}
        <div className="sbar">
          {[
            ["Total",          stats.total,    "s-gray",   null],
            ["Caducan ≤7d",    stats.expiring, "s-orange", "caduca"],
            ["Stock bajo",     stats.low,      "s-amber",  null],
            ["Agotados",       stats.out,      "s-red",    null],
          ].map(([l,n,c,goTab])=>(
            <div key={l} className="sitem" onClick={goTab?()=>setTab(goTab):undefined} style={goTab?{cursor:"pointer"}:{}}>
              <div className={`snum ${c}`}>{n}</div>
              <div className="slabel">{l}</div>
            </div>
          ))}
        </div>

        {/* ══════════════════════════════════════════════════════════════
            TAB: DESPENSA
        ══════════════════════════════════════════════════════════════ */}
        {tab==="despensa" && (
          <div className="content">
            <div className="bc-strip">
              <div className="bc-label">📊 Escanear código de barras</div>
              <div className="bc-row">
                <input className="bc-in" placeholder="O escribe el código manualmente…" value={barcode} onChange={e=>setBarcode(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleBarcodeInput()}/>
                <button className="cam-btn" onClick={openCamera}>📷 Cámara</button>
              </div>
              <div className="bc-hint">📱 Pulsa "Cámara" para escanear con el móvil — detección automática</div>
            </div>
            <div className="srow">
              <input className="sin" placeholder="🔎 Buscar producto…" value={search} onChange={e=>setSearch(e.target.value)}/>
              <select className="sort-sel" value={sortBy} onChange={e=>setSortBy(e.target.value)}>
                <option value="name">A–Z</option><option value="stock">Menos stock</option><option value="low">Más urgente</option>
              </select>
              <button className="btn-new" onClick={()=>openAdd()}>+ Nuevo</button>
            </div>
            <div className="chips">
              {CATEGORIES.map(c=><button key={c.id} className={`chip ${cat===c.id?"on":""}`} onClick={()=>setCat(c.id)}>{c.emoji} {c.label}</button>)}
            </div>
            {dataLoading ? (
              <div className="data-loading"><div className="spinner" style={{borderTopColor:"#2D5016",border:"3px solid #D1D5DB"}}/>Cargando despensa…</div>
            ) : filtered.length===0 ? (
              <div className="empty"><div className="empty-ico">🏪</div><div className="empty-t">Tu despensa está vacía</div><div className="empty-s">Pulsa "Cámara" o "+ Nuevo" para añadir el primer producto</div></div>
            ) : (
              <div className="pgrid">
                {filtered.map(p=>{
                  const s=p.stock||0, m=p.minStock||1, isOut=s===0, isLow=!isOut&&s<m;
                  const days = daysUntilExpiry(p.expiryDate);
                  const ei   = expiryInfo(days);
                  const bName=p.brandCustom||p.brand, sm=SUPERMARKETS.find(x=>x.id===p.supermarket);
                  const expCardCls = ei ? (ei.cls==="exp-red" ? "exp-crit" : ei.cls==="exp-amber" ? "exp-warn" : "") : "";
                  return (
                    <div key={p.id} className={`pcard ${isOut?"out":""} ${isLow&&!expCardCls?"low":""} ${expCardCls}`}>
                      {isOut&&<span className="pcard-badge badge-out">Agotado</span>}
                      {isLow&&!isOut&&!ei&&<span className="pcard-badge badge-low">⚠ Bajo</span>}
                      {ei&&!isOut&&<span className={`pcard-badge ${ei.cls}`}>{ei.label}</span>}
                      <div className="pcard-top" onClick={()=>openEdit(p)} title="Toca para editar">
                        <div className="p-emoji">{p.emoji||"📦"}</div>
                        <div className="p-name">{p.name}</div>
                        {(bName||sm)&&<div style={{display:"flex",gap:".25rem",flexWrap:"wrap",margin:".15rem 0 .05rem"}}>
                          {bName&&<span style={{fontSize:".58rem",padding:".08rem .35rem",borderRadius:"5px",background:"#F0EAFA",color:"#6D28D9",fontWeight:700}}>{bName}</span>}
                          {sm&&<span style={{fontSize:".58rem",padding:".08rem .35rem",borderRadius:"5px",background:sm.bg,color:sm.color,fontWeight:700}}>{sm.label}</span>}
                        </div>}
                        <div className="p-cat">{CATEGORIES.find(c=>c.id===p.category)?.emoji} {CATEGORIES.find(c=>c.id===p.category)?.label||"Otros"}</div>
                        {p.price>0&&<div className="p-price">{p.price.toFixed(2)} € / {p.unit||"ud"}</div>}
                        {p.addedBy&&<div style={{fontSize:".58rem",color:"#6B7260",marginTop:".1rem"}}>👤 {p.addedBy}</div>}
                        {ei&&<span className={`exp-badge ${ei.cls}`}>{ei.label}</span>}
                      </div>
                      <div className="sc">
                        <button className="sbtn sm" onClick={()=>updateStock(p.id,-1)}>−</button>
                        <div><div className="snum-big">{s}</div><div className="sunit">{p.unit||"ud"}</div></div>
                        <button className="sbtn sp" onClick={()=>updateStock(p.id,+1)}>+</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            TAB: CATÁLOGO
        ══════════════════════════════════════════════════════════════ */}
        {tab==="catalogo" && (
          <div className="content">
            <div className="srow">
              <input className="sin" placeholder="🔎 Buscar en catálogo…" value={search} onChange={e=>setSearch(e.target.value)}/>
              <button className="btn-new" onClick={()=>openAdd()}>+ Nuevo</button>
            </div>
            {products.filter(p=>p.name.toLowerCase().includes(search.toLowerCase())).length===0 ? (
              <div className="empty"><div className="empty-ico">📋</div><div className="empty-t">El catálogo está vacío</div><div className="empty-s">Crea fichas para no tener que registrar el mismo producto cada vez</div></div>
            ) : products.filter(p=>p.name.toLowerCase().includes(search.toLowerCase())).map(p=>{
              const bName=p.brandCustom||p.brand, sm=SUPERMARKETS.find(x=>x.id===p.supermarket);
              const days=daysUntilExpiry(p.expiryDate), ei=expiryInfo(days);
              return (
                <div key={p.id} className="citem">
                  <div className="c-emoji">{p.emoji||"📦"}</div>
                  <div className="c-info">
                    <div className="c-name">{p.name}</div>
                    <div className="c-meta">
                      <span>{CATEGORIES.find(c=>c.id===p.category)?.label||"Otros"}</span>
                      {p.barcode&&<span>📊 {p.barcode}</span>}
                      {bName&&<span style={{color:"#6D28D9",fontWeight:700}}>🏷 {bName}</span>}
                      {sm&&<span style={{color:sm.color,fontWeight:700}}>🏪 {sm.label}</span>}
                      {p.price>0&&<span>💰 {p.price.toFixed(2)} €</span>}
                      <span>Mín. {p.minStock||1} {p.unit||"ud"}</span>
                      {ei&&<span className={`exp-badge ${ei.cls}`}>{ei.label}</span>}
                    </div>
                  </div>
                  <div><div className="c-stock">{p.stock||0}</div><div className="c-unit">{p.unit||"ud"}</div></div>
                  <div className="c-acts">
                    <button className="ib ib-e" onClick={()=>openEdit(p)}>✎</button>
                    <button className="ib ib-d" onClick={()=>deleteProduct(p.id)}>🗑</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            TAB: COMPRA (v2 — nueva)
        ══════════════════════════════════════════════════════════════ */}
        {tab==="compra" && (
          <div className="content">

            {/* Sección: Necesitas reponer (auto) */}
            <div className="shop-sect">
              <div className="shop-hdr">
                <div>
                  <span className="shop-sect-title">Necesitas reponer</span>
                  {autoShopItems.length>0&&<span className="shop-count">{autoShopItems.length}</span>}
                </div>
              </div>
              {autoShopItems.length===0 ? (
                <div className="shop-all-ok">
                  <div className="shop-all-ok-ico">✅</div>
                  <div className="shop-all-ok-t">¡Todo al completo!</div>
                  <div className="shop-all-ok-s">Todos los productos tienen stock suficiente</div>
                </div>
              ) : autoShopItems.map(p=>{
                const s=p.stock||0, sm=SUPERMARKETS.find(x=>x.id===p.supermarket);
                return (
                  <div key={p.id} className="shop-item">
                    <div className="shop-emoji">{p.emoji||"📦"}</div>
                    <div className="shop-info">
                      <div className="shop-name">{p.name}</div>
                      <div className="shop-sub">{s===0?"Agotado":`Quedan ${s} ${p.unit||"ud"} — mín. ${p.minStock||1}`}</div>
                      {sm&&<span className="shop-sm" style={{background:sm.bg,color:sm.color}}>{sm.label}</span>}
                    </div>
                    <button className="shop-buy" onClick={()=>{updateStock(p.id,1);notify(`+1 ${p.name} ✓`);}}>+1 ✓</button>
                  </div>
                );
              })}
            </div>

            {/* Sección: Lista manual */}
            <div className="shop-sect">
              <div className="shop-hdr">
                <div>
                  <span className="shop-sect-title">Lista manual</span>
                  {manualShopItems.length>0&&<span className="shop-count">{manualShopItems.length}</span>}
                </div>
                {manualShopItems.length>0&&<button className="shop-clear" onClick={clearShopList}>Limpiar</button>}
              </div>
              {manualShopItems.length===0 ? (
                <div className="shop-empty">
                  <div className="shop-empty-ico">📝</div>
                  <div className="shop-empty-t">Lista vacía</div>
                  <div className="shop-empty-s">Añade lo que necesites debajo</div>
                </div>
              ) : manualShopItems.map(i=>(
                <div key={i.id} className="shop-item">
                  <div className="shop-emoji">{i.emoji||"📦"}</div>
                  <div className="shop-info">
                    <div className="shop-name">{i.name}</div>
                  </div>
                  <button className="shop-del-btn" onClick={()=>deleteShopItem(i.id)}>✓</button>
                </div>
              ))}
              <div className="shop-add-row">
                <input className="shop-add-in" placeholder="Añadir artículo…" value={shopInput} onChange={e=>setShopInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addShopItem()}/>
                <button className="shop-add-btn" onClick={addShopItem}>+ Añadir</button>
              </div>
            </div>

            {/* Botón WhatsApp */}
            {(autoShopItems.length>0||manualShopItems.length>0)&&(
              <button className="wa-btn" onClick={shareWhatsApp}>
                <span>💬</span> Compartir lista por WhatsApp
              </button>
            )}

          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            TAB: CADUCA (v2 — nueva)
        ══════════════════════════════════════════════════════════════ */}
        {tab==="caduca" && (
          <div className="content">

            {/* Recetas con IA */}
            <div className="cad-recipe-box">
              <div className="cad-recipe-title">🍳 Recetas con lo que caduca</div>
              <div className="cad-recipe-sub">
                La IA analiza los productos que vencen esta semana y sugiere 3 recetas para aprovecharlos antes de que caduquen.
              </div>
              <button className="cad-recipe-btn" onClick={fetchRecipes} disabled={recipesLoading}>
                {recipesLoading
                  ? <><span style={{animation:"spin .75s linear infinite",display:"inline-block"}}>🌿</span> Generando recetas…</>
                  : <><span>✨</span> Sugerir recetas con IA</>
                }
              </button>
              {recipesLoading && (
                <div className="rec-spinner">
                  <div className="spinner" style={{borderTopColor:"#2D5016",border:"3px solid #D1D5DB",width:"24px",height:"24px"}}/>
                  Preguntando a la IA…
                </div>
              )}
              {recipes.length>0&&(
                <div className="rec-grid">
                  {recipes.map((r,i)=>(
                    <div key={i} className="rec-card">
                      <div className="rec-name">{r.nombre}</div>
                      <div className="rec-time">⏱ {r.tiempo}</div>
                      <div className="rec-section-label">Ingredientes principales</div>
                      <div className="rec-ings">{(r.ingredientes||[]).join(" · ")}</div>
                      <div className="rec-section-label">Pasos</div>
                      <ol className="rec-steps">
                        {(r.pasos||[]).map((paso,j)=><li key={j}>{paso}</li>)}
                      </ol>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Sin productos con caducidad */}
            {withExpiry.length===0 ? (
              <div className="cad-empty">
                <div className="cad-empty-ico">📅</div>
                <div className="cad-empty-t">Sin fechas de caducidad registradas</div>
                <div className="cad-empty-s">Edita cualquier producto desde la Despensa o el Catálogo<br/>y añade su fecha de caducidad para verla aquí.</div>
              </div>
            ) : (
              <>
                {expiredProds.length>0&&(
                  <div className="cad-group">
                    <div className="cad-gtitle cg-red">Caducados — revisar</div>
                    {expiredProds.map(p=>{
                      const d=daysUntilExpiry(p.expiryDate);
                      return (
                        <div key={p.id} className="cad-item ci-red">
                          <div className="cad-emoji">{p.emoji||"📦"}</div>
                          <div className="cad-info">
                            <div className="cad-name">{p.name}</div>
                            <div className={`cad-days cd-red`}>{d===-1?"Caducó ayer":`Hace ${Math.abs(d)} días`}</div>
                            <div className="cad-stock">{p.stock||0} {p.unit||"ud"} en stock</div>
                          </div>
                          <button className="cad-edit" onClick={()=>openEdit(p)}>Editar</button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {thisWeekProds.length>0&&(
                  <div className="cad-group">
                    <div className="cad-gtitle cg-amber">Esta semana</div>
                    {thisWeekProds.map(p=>{
                      const d=daysUntilExpiry(p.expiryDate);
                      const ei=expiryInfo(d);
                      return (
                        <div key={p.id} className={`cad-item ${ei?.borderCls||""}`}>
                          <div className="cad-emoji">{p.emoji||"📦"}</div>
                          <div className="cad-info">
                            <div className="cad-name">{p.name}</div>
                            <div className={`cad-days ${ei?.dayCls||""}`}>{ei?.label}</div>
                            <div className="cad-stock">{p.stock||0} {p.unit||"ud"} en stock · {p.expiryDate}</div>
                          </div>
                          <button className="cad-edit" onClick={()=>openEdit(p)}>Editar</button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {soonProds.length>0&&(
                  <div className="cad-group">
                    <div className="cad-gtitle cg-green">Este mes</div>
                    {soonProds.map(p=>{
                      const d=daysUntilExpiry(p.expiryDate);
                      const ei=expiryInfo(d);
                      return (
                        <div key={p.id} className="cad-item">
                          <div className="cad-emoji">{p.emoji||"📦"}</div>
                          <div className="cad-info">
                            <div className="cad-name">{p.name}</div>
                            <div className={`cad-days cd-green`}>{d} días</div>
                            <div className="cad-stock">{p.stock||0} {p.unit||"ud"} en stock · {p.expiryDate}</div>
                          </div>
                          <button className="cad-edit" onClick={()=>openEdit(p)}>Editar</button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}

          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            TAB: GRUPO (sin cambios)
        ══════════════════════════════════════════════════════════════ */}
        {tab==="grupo" && (
          <div className="content">
            <div className="stitle">Miembros del hogar</div>
            <div className="srow" style={{marginBottom:"1.1rem"}}>
              <input className="sin" placeholder="Nombre del miembro…" value={memberName} onChange={e=>setMemberName(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addMember()}/>
              <button className="btn-new" onClick={addMember}>+ Añadir</button>
            </div>
            {members.length===0 ? (
              <div className="empty" style={{marginBottom:"1rem"}}><div className="empty-ico">👥</div><div className="empty-t">Aún no hay miembros</div><div className="empty-s">Añade a las personas de tu hogar</div></div>
            ) : (
              <div className="mgrid">
                {members.map(m=>(
                  <div key={m.id} className="mcard">
                    <div className="m-avatar">{m.name[0].toUpperCase()}</div>
                    <div className="m-name">{m.name}</div>
                    <div className="m-joined">Desde {m.joined}</div>
                    <button className="m-del" onClick={()=>deleteMember(m.id,m.name)}>Eliminar</button>
                  </div>
                ))}
              </div>
            )}
            <div className="info-box">
              <div className="info-title">🔑 Código de tu despensa — compártelo</div>
              <div className="info-text">Cualquier persona que introduzca este código verá y editará la despensa en tiempo real desde su dispositivo.</div>
              <div className="code-box">
                <span className="code-val">{pantryId}</span>
                <button className="copy-btn" onClick={()=>{navigator.clipboard?.writeText(pantryId);notify("Código copiado 📋");}}>Copiar</button>
              </div>
            </div>
            <button className="leave-btn" onClick={leavePantry}>Salir de esta despensa</button>
          </div>
        )}

        {/* ── OVERLAY: Compartir ───────────────────────────────────────── */}
        {showShare && (
          <div className="share-ov" onClick={e=>e.target===e.currentTarget&&setShowShare(false)}>
            <div className="share-card">
              <div className="share-title">Compartir despensa</div>
              <div className="share-sub">Comparte este código con tu familia o compañeros. Podrán unirse desde cualquier dispositivo y ver el stock en tiempo real.</div>
              <div className="share-code">{pantryId}</div>
              <button className="share-copy" onClick={()=>{navigator.clipboard?.writeText(pantryId);notify("Código copiado 📋");setShowShare(false);}}>📋 Copiar código</button>
              <button className="share-close" onClick={()=>setShowShare(false)}>Cerrar</button>
            </div>
          </div>
        )}

        {/* ── MODAL: Añadir / Editar producto ─────────────────────────── */}
        {modal && (
          <div className="ov" onClick={e=>e.target===e.currentTarget&&closeModal()}>
            <div className="mod">
              <div className="mod-title">{modal==="add"?"Nuevo producto":"Editar producto"}</div>
              <div className="fg"><label className="fl">Nombre del producto *</label><input className="fi" placeholder="Ej: Leche entera 1L" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></div>
              <div className="fg"><label className="fl">Emoji / Icono</label><div className="ep">{EMOJIS.map(e=><button key={e} className={`eo ${form.emoji===e?"on":""}`} onClick={()=>setForm({...form,emoji:e})}>{e}</button>)}</div></div>
              <div className="fr">
                <div className="fg"><label className="fl">Categoría</label><select className="fsel" value={form.category} onChange={e=>setForm({...form,category:e.target.value})}>{CATEGORIES.filter(c=>c.id!=="todas").map(c=><option key={c.id} value={c.id}>{c.emoji} {c.label}</option>)}</select></div>
                <div className="fg"><label className="fl">Unidad</label><select className="fsel" value={form.unit} onChange={e=>setForm({...form,unit:e.target.value})}>{UNITS.map(u=><option key={u} value={u}>{u}</option>)}</select></div>
              </div>
              <div className="fr">
                <div className="fg"><label className="fl">Precio (€)</label><input className="fi" type="number" placeholder="0.00" step="0.01" min="0" value={form.price} onChange={e=>setForm({...form,price:e.target.value})}/></div>
                <div className="fg"><label className="fl">Stock mínimo</label><input className="fi" type="number" placeholder="2" min="0" value={form.minStock} onChange={e=>setForm({...form,minStock:e.target.value})}/></div>
              </div>
              {/* ── NUEVO v2: Fecha de caducidad ── */}
              <div className="fg">
                <label className="fl">📅 Fecha de caducidad (opcional)</label>
                <input className="fi" type="date" value={form.expiryDate} onChange={e=>setForm({...form,expiryDate:e.target.value})}/>
              </div>
              <div className="fg"><label className="fl">Código de barras (opcional)</label><input className="fi" placeholder="Ej: 8410525028888" value={form.barcode} onChange={e=>setForm({...form,barcode:e.target.value})}/></div>
              <div className="fg">
                <label className="fl">🏪 Supermercado</label>
                <div style={{display:"flex",flexWrap:"wrap",gap:".35rem",marginTop:".3rem"}}>
                  {SUPERMARKETS.map(s=>{const on=form.supermarket===s.id;return<button key={s.id} onClick={()=>setForm({...form,supermarket:on?"":s.id})} style={{padding:".28rem .7rem",borderRadius:"20px",border:`1.5px solid ${on?s.color:"#D4CEBC"}`,background:on?s.bg:"white",color:on?s.color:"#374151",fontSize:".75rem",fontFamily:"'Nunito',sans-serif",fontWeight:on?700:500,cursor:"pointer",transition:"all .15s"}}>{s.label}</button>;})}
                </div>
              </div>
              <div className="fg">
                <label className="fl">🏷 Marca</label>
                <div style={{display:"flex",flexWrap:"wrap",gap:".35rem",marginTop:".3rem",maxHeight:"120px",overflowY:"auto",padding:"2px 0"}}>
                  {BRANDS.map(b=>{const on=form.brand===b&&!form.brandCustom;return<button key={b} onClick={()=>setForm({...form,brand:on?"":b,brandCustom:""})} style={{padding:".28rem .7rem",borderRadius:"20px",border:`1.5px solid ${on?"#6D28D9":"#D4CEBC"}`,background:on?"#F0EAFA":"white",color:on?"#6D28D9":"#374151",fontSize:".75rem",fontFamily:"'Nunito',sans-serif",fontWeight:on?700:500,cursor:"pointer",transition:"all .15s",whiteSpace:"nowrap"}}>{b}</button>;})}
                </div>
                <input className="fi" style={{marginTop:".5rem"}} placeholder="O escribe la marca…" value={form.brandCustom} onChange={e=>setForm({...form,brandCustom:e.target.value,brand:e.target.value?"":form.brand})}/>
              </div>
              <div className="macts">
                {modal==="edit"&&<button className="bd" onClick={()=>{deleteProduct(editId);closeModal();}}>🗑 Borrar</button>}
                <button className="bs" onClick={closeModal}>Cancelar</button>
                <button className="bp" onClick={submitProduct}>{modal==="add"?"Añadir al catálogo":"Guardar cambios"}</button>
              </div>
            </div>
          </div>
        )}

        {/* ── OVERLAY: Escáner de cámara ───────────────────────────────── */}
        {cameraOpen && (
          <div className="cam-ov">
            <div className="cam-box">
              <div className="cam-hdr"><div className="cam-title">📷 Escáner de código de barras</div><button className="cam-x" onClick={stopCamera}>✕</button></div>
              {camState==="error" ? <div className="cam-err"><strong>No se pudo abrir la cámara</strong>{camError}<br/><button className="cam-err-btn" onClick={stopCamera}>Cerrar</button></div>
              : camState==="loading" ? <div className="cam-loading"><div className="spinner"/>Solicitando acceso a la cámara…</div>
              : <><div className="cam-vp"><video ref={videoRef} className="cam-video" playsInline muted/><div className="cam-overlay"><div className="cam-frame"><div className="cam-scan-line"/></div></div></div><div className="cam-tip">Centra el código dentro del recuadro<br/>🟢 Detección automática</div></>}
            </div>
          </div>
        )}

        {/* ── OVERLAY: Identificación de usuario ──────────────────────── */}
        {askingName && (
          <div className="share-ov">
            <div className="share-card">
              <div className="share-title">👋 ¿Cómo te llamas?</div>
              <div className="share-sub">Tu nombre aparecerá cuando añadas productos a la despensa.</div>
              <input
                className="setup-input normal"
                placeholder="Tu nombre…"
                value={userInput}
                onChange={e=>setUserInput(e.target.value)}
                onKeyDown={e=>e.key==="Enter"&&saveUserName()}
                style={{marginBottom:"1rem",textAlign:"center",fontSize:"1.1rem"}}
                autoFocus
              />
              <button className="share-copy" onClick={saveUserName} disabled={!userInput.trim()}>Guardar →</button>
              <button className="share-close" onClick={()=>setAskingName(false)}>Saltar</button>
            </div>
          </div>
        )}

        {toast&&<div className={`toast t-${toast.type}`}>{toast.msg}</div>}
      </div>
    </>
  );
}
